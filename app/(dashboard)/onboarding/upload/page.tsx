import { ResumeUploadForm } from "@/components/resume/resume-upload-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Upload your resume"
        description="Step 1 of 2 — AI extracts skills and projects to power your interviews."
      />
      <ResumeUploadForm />
    </div>
  );
}
