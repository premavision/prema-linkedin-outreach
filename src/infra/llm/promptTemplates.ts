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

  return `You are assisting a human sales consultant. Draft ${input.count} concise LinkedIn outreach messages. Each should:\n- be professional and friendly, not pushy\n- mention specifics from the profile\n- invite a short intro call\n- avoid sounding automated\n\nOffer context:\n${input.offerContext}\n\nProspect:\nName: ${input.name}\n${profileBits}`;
};
