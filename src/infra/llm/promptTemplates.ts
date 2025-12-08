export const outreachPrompt = (input: {
  name: string;
  role?: string | null;
  company?: string | null;
  profileSummary?: string | null;
  offerContext: string;
  count: number;
}) => {
  const profileBits = [
    input.role ? `Role: ${input.role}` : null,
    input.company ? `Company: ${input.company}` : null,
    input.profileSummary ? `Profile summary: ${input.profileSummary}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `You are assisting a human sales consultant. Draft ${input.count} concise LinkedIn outreach messages. Each should:
- be professional and friendly, not pushy
- mention specifics from the profile
- invite a short intro call
- avoid sounding automated

Offer context:
${input.offerContext}

Prospect:
Name: ${input.name}
${profileBits}

IMPORTANT: Separate each message with "---MESSAGE_SEPARATOR---". Do not include any other labels or numbering (like "Variant 1" or "Message 1") in the output. Just the message body. Do not include any conversational filler before or after the messages. Start directly with the first message or the separator.`;
};
