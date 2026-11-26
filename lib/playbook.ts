// Viralize texting script. Hunter's real texts, word for word.

export type Script = { title: string; when?: string; text: string };
export type Objection = { they: string; you: string[]; note?: string };

export const FLOW: Script[] = [
  {
    title: "1. Opener",
    when: "Send after they comment on the post. Set your area at the top and it fills in.",
    text:
      "Hey man, appreciate you commenting on our post.\n\n" +
      "We work with contractors helping them get consistent inbound jobs, not random leads. We're looking to help 2-5 more companies in {area} so we don't stack competitors on top of each other.\n\n" +
      "Quick question so I don't waste your time, how are you getting most of your work right now?\n\n" +
      "- Referrals / word of mouth\n- Facebook groups\n- Google\n- ads\n- mix of everything",
  },
  {
    title: "2. After they answer",
    when: "Wait for their response first.",
    text: "Fair.\nWould 5-10 inbound quote requests a month be useful for you right now?",
  },
  {
    title: "3. They say yes: explain + push for the call",
    text:
      "Perfect. Just to clarify real quick, we don't subcontract or hand out jobs.\n\n" +
      "What we do is help you set up your own inbound system so you're not dependent on anyone else for work. You show up when people search things like \"contractor near me\" on Google or Meta, and the quote requests come straight to you.\n\n" +
      "If that's what you're looking for, I'm happy to walk you through how it works and see if it even makes sense for your company sometime this week?",
  },
  {
    title: "4. Lock in the time",
    text: "What's a good time for you this week",
  },
];

export const OBJECTIONS: Objection[] = [
  {
    they: "What is the cost? / Can you give me more details and prices?",
    you: [
      "What we do is help you set up your own inbound system so you're not dependent on anyone else for work. Sort of like lead generation but stuff that actually works.\n\nTo give you a price we usually jump on a quick call to understand a bit more about your business and see if we could even help. Fair enough?",
      "What's a good time for you this week",
    ],
  },
  {
    they: "What's the catch? Do you guys take a percentage?",
    you: [
      "There's no catch. It is performance based, meaning you only pay once we make you the extra 10-15K.\n\nWhat we do is help you set up your own inbound system so you're not dependent on anyone else for work. Sort of like lead generation but stuff that actually works.\n\nI'd be happy to walk you through it and see if it even makes sense for you sometime this week?",
    ],
  },
  {
    they: "Most of our work comes from referrals and word of mouth",
    you: [
      "What we do is help you set up your own inbound system so you're not dependent on anyone else for work. Sort of like lead generation but stuff that actually works.\n\nI'd be happy to walk you through it and see if it even makes sense for you. You have some time to hop on a quick call some time this week?",
    ],
  },
];
