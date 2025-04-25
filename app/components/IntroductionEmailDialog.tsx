import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Person } from "@/lib/supabase";

interface IntroductionEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourcePerson: Person;
  targetPerson: Person;
  reasons: {
    source: string;
    target: string;
  };
}

export function IntroductionEmailDialog({
  open,
  onOpenChange,
  sourcePerson,
  targetPerson,
  reasons,
}: IntroductionEmailDialogProps) {
  const subject = `Intro to ${targetPerson.name}?`;
  const emailBody = `Hey ${sourcePerson.name.split(' ')[0]}! thought of you for an intro:

${targetPerson.name} is a ${targetPerson.title}${targetPerson.company ? ` at ${targetPerson.company}` : ''}. ${reasons.source} ${reasons.target}

Let me know if you're interested! I'll loop her in.`;

  const handleSend = () => {
    // TODO: Implement actual email sending functionality
    console.log('Sending email:', {
      to: sourcePerson.email,
      subject,
      body: emailBody,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Compose Introduction Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              value={sourcePerson.email || ''}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={emailBody}
              readOnly
              className="min-h-[200px] bg-muted"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend}>
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 