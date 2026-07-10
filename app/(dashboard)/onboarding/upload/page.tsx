import { ResumeUploadForm } from "@/components/resume/resume-upload-form";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Upload your resume</h1>
        <p className="mt-2 text-muted-foreground">
          Step 1 of 3 — AI will extract your skills and projects
        </p>
      </div>
      <ResumeUploadForm />
    </div>
  );
}
