export type EmailLog = {
  body: string;
  error_message: string | null;
  id: string;
  lead_id: string | null;
  recipient_email: string;
  sent_at: string;
  status: string;
  subject: string;
  user_id: string;
};
