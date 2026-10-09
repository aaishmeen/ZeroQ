export type Role = 'student' | 'volunteer' | 'organizer' | 'admin' | 'superadmin';

export interface User {
  id: number;
  name: string;
  email: string;
  reg_no?: string | null;
  phone: string;
  role: Role;
  volunteer_id?: string | null;
  avatar_url?: string | null;
  avatar_public_id?: string | null;
  bio?: string | null;
  status?: 'pending' | 'approved' | 'rejected';
  is_approved_volunteer?: boolean;
}

export type EventStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'REJECTED' | 'ARCHIVED' | string;

export interface EventItem {
  id: number;
  title: string;
  description: string;
  venue: string;
  date: string; // YYYY-MM-DD
  capacity: number;
  price: number;
  owner_id: number;
  status: EventStatus;
  rejection_reason?: string | null;
  banner_url?: string | null;
  banner_public_id?: string | null;
  payment_qr_url?: string | null;
  volunteers_limit?: number;
  accepting_volunteers?: boolean;
}

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Registration {
  id: number;
  user_id: number;
  event_id: number;
  status: RegistrationStatus;
  qr_token?: string | null;
  qr_generated_at?: string | null;
  checked_in_at?: string | null;
}

export interface RegistrationDetails {
  id: number;
  status: RegistrationStatus;
  user_id: number;
  student_name: string;
  student_email: string;
  registration_number: string;
}

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Payment {
  id: number;
  registration_id: number;
  amount: number;
  screenshot_path: string;
  transaction_id: string | null;
  status: PaymentStatus;
  rejection_reason?: string | null;
  reviewed_by?: number | null;
  uploaded_at: string;
  reviewed_at?: string | null;
}

export interface VolunteerOpening {
  id: number;
  event_id: number;
  role: string;
  volunteers_needed: number;
  description?: string | null;
  deadline?: string | null;
  gate_area?: string | null;
  status: 'open' | 'closed';
  created_at: string;
  created_by: number;
  event_title?: string | null;
  event_date?: string | null;
  event_venue?: string | null;
  applications_count: number;
  approved_count: number;
  remaining_count: number;
}

export interface VolunteerApplication {
  id: number;
  user_id: number;
  event_id: number;
  opening_id?: number | null;
  role_name?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  experience?: string | null;
  applied_at: string;
  reviewed_at?: string | null;
  student_name?: string | null;
  student_email?: string | null;
  student_phone?: string | null;
  volunteer_code?: string | null;
  event_title?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  assignment_id?: number | null;
  assigned_position?: string | null;
}

export interface ApprovedVolunteerWithAssignment {
  application_id: number;
  volunteer_id: number;
  student_name: string;
  student_email: string;
  student_phone?: string | null;
  volunteer_code?: string | null;
  avatar_url?: string | null;
  event_id: number;
  event_title: string;
  opening_id?: number | null;
  role_name: string;
  approved_at?: string | null;
  assignment_id?: number | null;
  assigned_position?: string | null;
}

export interface VolunteerAssignment {
  id: number;
  volunteer_id: number;
  event_id: number;
  position: string;
  status: 'active' | 'unassigned';
  assigned_at: string;
  volunteer_name?: string | null;
  volunteer_email?: string | null;
  volunteer_code?: string | null;
  event_title?: string | null;
  avatar_url?: string | null;
}

export interface AssignmentItem {
  assignment_id: number;
  event_id: number;
  event_title: string;
  event_venue: string;
  event_date: string;
  event_status?: string | null;
  position: string;
  status: string;
  assigned_at: string;
}

export interface MyVolunteerAssignment {
  has_assignment: boolean;
  volunteer_id?: string;
  assignment_id?: number;
  event_id?: number;
  event_title?: string;
  event_venue?: string;
  event_date?: string;
  event_status?: string | null;
  position?: string;
  status?: string;
  assigned_at?: string;
  application_status?: 'pending' | 'approved' | 'rejected' | 'none';
  all_assignments?: AssignmentItem[];
}

export interface AvailableVolunteerEvent {
  id: number;
  title: string;
  description: string;
  venue: string;
  date: string;
  capacity: number;
  volunteers_limit?: number;
  approved_volunteers_count?: number;
  banner_url?: string | null;
  status?: string | null;
  application_status: 'pending' | 'approved' | 'rejected' | 'none';
  openings?: VolunteerOpening[];
}

export type DisputeCategory =
  | 'QR Issue'
  | 'Payment Issue'
  | 'Registration Issue'
  | 'Attendee Information'
  | 'Ticket Issue'
  | 'Other';

export type DisputeStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface Dispute {
  id: number;
  event_id: number;
  volunteer_id: number;
  position: string;
  category: DisputeCategory | string;
  registration_id?: number | null;
  description: string;
  status: DisputeStatus;
  created_at: string;
  resolved_at?: string | null;
  volunteer_name?: string | null;
  event_title?: string | null;
}

export interface VolunteerNotification {
  id: number;
  event_id: number;
  sender_id: number;
  recipient_id?: number | null;
  target_role?: string | null;
  title: string;
  message: string;
  created_at: string;
  event_title?: string | null;
  sender_name?: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
