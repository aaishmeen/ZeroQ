import os
import io
import sys
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import HTTPException
from fastapi.datastructures import UploadFile

from database.database import Base, engine, SessionLocal
from models.user import User
from models.event import Event
from schemas.user import UserResponse
from schemas.event import EventResponse
from services.cloudinary_service import (
    validate_and_read_image,
    upload_image_to_cloudinary,
    delete_cloudinary_image,
    init_cloudinary
)


class TestCloudinaryIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_file_validation_valid_image(self):
        content = b"fake_image_bytes_png"
        file = UploadFile(
            filename="test.png",
            file=io.BytesIO(content),
            headers={"content-type": "image/png"}
        )
        bytes_out = validate_and_read_image(file, max_size_mb=5.0)
        self.assertEqual(bytes_out, content)

    def test_file_validation_invalid_type(self):
        file = UploadFile(
            filename="test.pdf",
            file=io.BytesIO(b"pdf_content"),
            headers={"content-type": "application/pdf"}
        )
        with self.assertRaises(HTTPException) as ctx:
            validate_and_read_image(file, max_size_mb=5.0)
        self.assertEqual(ctx.exception.status_code, 400)

    def test_file_validation_oversized(self):
        large_content = b"0" * (6 * 1024 * 1024)  # 6 MB
        file = UploadFile(
            filename="large.jpg",
            file=io.BytesIO(large_content),
            headers={"content-type": "image/jpeg"}
        )
        with self.assertRaises(HTTPException) as ctx:
            validate_and_read_image(file, max_size_mb=5.0)
        self.assertEqual(ctx.exception.status_code, 400)

    @patch("cloudinary.uploader.upload")
    @patch("services.cloudinary_service.init_cloudinary")
    def test_upload_image_to_cloudinary(self, mock_init, mock_upload):
        mock_upload.return_value = {
            "secure_url": "https://res.cloudinary.com/demo/image/upload/v1234/zeroq/profiles/test.jpg",
            "public_id": "zeroq/profiles/test"
        }
        res = upload_image_to_cloudinary(b"test_bytes", folder="zeroq/profiles")
        self.assertEqual(res["secure_url"], "https://res.cloudinary.com/demo/image/upload/v1234/zeroq/profiles/test.jpg")
        self.assertEqual(res["public_id"], "zeroq/profiles/test")

    @patch("cloudinary.uploader.destroy")
    @patch("services.cloudinary_service.init_cloudinary")
    def test_delete_cloudinary_image(self, mock_init, mock_destroy):
        mock_destroy.return_value = {"result": "ok"}
        result = delete_cloudinary_image("zeroq/profiles/test")
        self.assertTrue(result)
        mock_destroy.assert_called_once_with("zeroq/profiles/test", resource_type="image")

    @patch("services.cloudinary_service.delete_cloudinary_image")
    @patch("services.cloudinary_service.upload_image_to_cloudinary")
    def test_avatar_upload_and_replacement_flow(self, mock_upload, mock_delete):
        from routers.users import upload_avatar

        mock_upload.side_effect = [
            {"secure_url": "https://res.cloudinary.com/demo/avatar1.jpg", "public_id": "zeroq/profiles/avatar1"},
            {"secure_url": "https://res.cloudinary.com/demo/avatar2.jpg", "public_id": "zeroq/profiles/avatar2"}
        ]

        # 1. Create a dummy test user
        user = User(
            name="Cloudinary User",
            email="cloud_user_test@test.com",
            phone="1234567890",
            password="hashed_pwd",
            role="student"
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        try:
            # First upload
            file1 = UploadFile(
                filename="avatar1.png",
                file=io.BytesIO(b"avatar_bytes_1"),
                headers={"content-type": "image/png"}
            )
            updated_user1 = upload_avatar(file=file1, current_user=user, db=self.db)
            self.assertEqual(updated_user1.avatar_url, "https://res.cloudinary.com/demo/avatar1.jpg")
            self.assertEqual(updated_user1.avatar_public_id, "zeroq/profiles/avatar1")

            # Second upload (replacement)
            file2 = UploadFile(
                filename="avatar2.png",
                file=io.BytesIO(b"avatar_bytes_2"),
                headers={"content-type": "image/png"}
            )
            updated_user2 = upload_avatar(file=file2, current_user=user, db=self.db)
            self.assertEqual(updated_user2.avatar_url, "https://res.cloudinary.com/demo/avatar2.jpg")
            self.assertEqual(updated_user2.avatar_public_id, "zeroq/profiles/avatar2")

            # Old asset should be deleted
            mock_delete.assert_called_with("zeroq/profiles/avatar1")

        finally:
            self.db.delete(user)
            self.db.commit()

    @patch("services.cloudinary_service.delete_cloudinary_image")
    @patch("services.cloudinary_service.upload_image_to_cloudinary")
    def test_banner_upload_and_authorization(self, mock_upload, mock_delete):
        from routers.events import upload_event_banner

        mock_upload.return_value = {
            "secure_url": "https://res.cloudinary.com/demo/banner1.jpg",
            "public_id": "zeroq/event-banners/banner1"
        }

        owner = User(
            name="Organizer User",
            email="org_user_test@test.com",
            phone="1234567890",
            password="hashed_pwd",
            role="organizer"
        )
        stranger = User(
            name="Other User",
            email="other_user_test@test.com",
            phone="1234567890",
            password="hashed_pwd",
            role="organizer"
        )
        self.db.add_all([owner, stranger])
        self.db.commit()
        self.db.refresh(owner)
        self.db.refresh(stranger)

        event = Event(
            title="Cloudinary Event Test",
            description="Event banner test",
            venue="Hall 1",
            date="2026-12-01",
            capacity=50,
            price=0,
            owner_id=owner.id,
            status="APPROVED"
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)

        try:
            banner_file = UploadFile(
                filename="banner.jpg",
                file=io.BytesIO(b"banner_bytes"),
                headers={"content-type": "image/jpeg"}
            )

            # Unauthorized attempt by stranger -> should raise 403
            with self.assertRaises(HTTPException) as ctx:
                upload_event_banner(
                    event_id=event.id,
                    file=banner_file,
                    db=self.db,
                    current_user=stranger
                )
            self.assertEqual(ctx.exception.status_code, 403)

            # Authorized attempt by owner -> should succeed
            banner_file.file.seek(0)
            res = upload_event_banner(
                event_id=event.id,
                file=banner_file,
                db=self.db,
                current_user=owner
            )
            self.assertEqual(res["banner_url"], "https://res.cloudinary.com/demo/banner1.jpg")
            self.db.refresh(event)
            self.assertEqual(event.banner_public_id, "zeroq/event-banners/banner1")

        finally:
            self.db.delete(event)
            self.db.delete(owner)
            self.db.delete(stranger)
            self.db.commit()


if __name__ == "__main__":
    unittest.main()
