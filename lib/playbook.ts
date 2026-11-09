// Viralize texting playbook. One goal: book the call. Never sell in text.
// [Name] = their first name. [trade] = what they do (snow removal, roofing...). [jobs] = their word for it (contracts, jobs, installs).

export type Script = { title: string; when?: string; text: string };
export type Objection = { they: string; you: string; note?: string };

export const RULES: string[] = [
  "The only goal is the call. Don't sell in text, don't explain the whole thing in text.",
  "Reply fast. Under 5 minutes if you can. Hot leads go cold in an hour.",
  "One question per text. Short. Sound like a guy, not a company.",
  "Ask before you pitch. Get them to say their problem in their own words.",
  "Use their words back. If they say \"contracts\", you say \"contracts\".",
  "Never send prices in text. \"Depends on the setup, easier on a quick call.\"",
  "Always give two times. \"Wednesday or Thursday?\" Never \"when are you free?\"",
  "Lead with help. Free pointers, free look at their ads. We're the obvious choice, not begging.",
  "Never say \"proposal\". Say \"the plan\" or \"what we'd run for you\".",
  "Log it. Every reply goes in the app. Every booked call gets a time and who's taking it.",
];

export const FLOW: Script[] = [
  {
    title: "1. Opener (they dropped info on our post)",
    when: "Send as soon as you get the list. Fast wins.",
    text: "Hey [Name], it's [Your name] from the post. Thanks for dropping your info. Quick question, how are you getting most of your clients right now?",
  },
  {
    title: "1b. Opener (cold, saw their ad or post)",
    when: "When you find them yourself, like their own Facebook ad.",
    text: "Hey [Name], saw your Facebook ad and some of the comments. Couple small tweaks and you could be pulling a lot more [jobs] this season. Happy to show you what I'd change for free if you've got 15 min this week.",
  },
  {
    title: "2. Dig (pick 2 or 3, one per text)",
    when: "Get numbers. Numbers make the call easy.",
    text:
      "Is that mostly word of mouth, or are you running ads or posting anywhere?\n\n" +
      "Roughly how many new [jobs] a month does that bring in?\n\n" +
      "What are you charging per [job]?\n\n" +
      "How much have you spent on ads, and how many [jobs] did that get you?\n\n" +
      "If more work came in, could you handle it?",
  },
  {
    title: "3. Bridge",
    when: "Once you know how they get work and roughly what it's worth.",
    text: "Makes sense. We help [trade] guys like you get more booked [jobs], and most of the time you don't pay us until the work closes. Would you be open to that?",
  },
  {
    title: "4. Push for the call",
    when: "The second they show any interest. Don't keep texting.",
    text: "Easier to show you on a quick 15 min call than type it all out. Wednesday or Thursday better?",
  },
  {
    title: "5. Lock it in",
    when: "Then add the lead in the app with the call time and who's taking it.",
    text: "Perfect, [day] at [time]. [Caller] will call you from [number]. Talk then.",
  },
];

export const REMINDERS: Script[] = [
  { title: "Morning of the call", text: "Hey [Name], still good for [time] today?" },
  { title: "No show", text: "Hey [Name], tried you at [time], no stress. What works better, later today or tomorrow?" },
  { title: "After the call (call done / follow up)", text: "Good talking today [Name]. Like I said, [one line recap]. I'll send over the plan [day]." },
];

export const GHOSTED: Script[] = [
  { title: "Day 1 no reply", text: "Hey [Name], did you still want those pointers on getting more [jobs]?" },
  { title: "Day 3", text: "Quick one, still open to a 15 min call this week? If the timing's bad just say so." },
  { title: "Day 7 (last one, then move to Lost)", text: "Last one from me. If getting more [jobs] becomes a priority, text me and we'll set something up." },
];

export const OBJECTIONS: Objection[] = [
  {
    they: "Who are you? / How would you help me?",
    you: "I'm [Your name] with Viralize, we get [trade] guys more booked [jobs] from Facebook and Google. Saw you on the post and figured I'd reach out. How are you getting most of your work right now?",
    note: "Answer in one line, then go straight back to a question about them.",
  },
  {
    they: "Is it free? / How much does it cost?",
    you: "Depends on the setup. Most guys, we bring the [jobs] first and they pay us a cut after it closes, so you're not out of pocket. Easier to walk through on a quick call, Wednesday or Thursday?",
    note: "Never give a number in text.",
  },
  {
    they: "I don't have the money to pay anyone",
    you: "Totally get it, a lot of the guys we work with started with nothing, no tractor, no blower even. We mostly work on a percentage of closed deals, so you only pay when you get paid. Worth 15 min to see if it fits?",
  },
  {
    they: "I get enough work from word of mouth",
    you: "That's a good spot to be in. Is it steady all year or does it dry up in the slow months? If there's a way to fill the slow months, worth a quick call?",
  },
  {
    they: "I tried ads / an agency before and got burned",
    you: "Yeah, that's most guys we talk to. Usually they paid upfront and got junk leads. We do it the other way, you pay when [jobs] close. Want me to show you what probably went wrong last time?",
  },
  {
    they: "Just text me the info",
    you: "Can do, but it's different for every business so a text won't do it justice. 15 min call and I'll show you exactly what we'd run for you. Today or tomorrow better?",
  },
  {
    they: "I'm busy right now",
    you: "No stress. When does it calm down? I'll put you in for then.",
    note: "Set a follow-up date in the app for whatever they say.",
  },
  {
    they: "Is this a scam?",
    you: "Fair question. Viralize Inc., based in Ottawa, viralize.ca. Hop on a quick call and judge for yourself, no card, no commitment.",
  },
  {
    they: "Let me think about it",
    you: "For sure. What part are you on the fence about?",
    note: "Answer what they say, then: \"Want to lock in 15 min Thursday so you can ask me directly?\"",
  },
  {
    they: "Not interested",
    you: "All good. Out of curiosity, is it that you're booked solid or just bad timing?",
    note: "If they're firm: \"Respect it. If that changes you've got my number.\" Then move them to Lost.",
  },
];

export const EXAMPLE = {
  title: "What good looks like (Hunter, snow removal)",
  lines: [
    "Opened cold off his own Facebook ad: could help him land ~30 contracts this season, happy to explain.",
    "He pushed back: who are you, how would more ads help? Hunter gave one line on who he is, a real result (spent $300, made $5K last season), and offered to show what's wrong with his ads for free.",
    "He said he can't pay anyone. Hunter: lots of guys start from nothing, free pointers first, and we work on a percentage of closed deals.",
    "Dug for numbers: spent ~$150 in 2 weeks, got 4 signed and paid, $649 single / $849 triple.",
    "Pushed for the call with a specific day: let's talk Wednesday, give me a good time.",
  ],
  why: "Never pitched the service. Led with free help, killed the money objection with pay-on-results, got his numbers, and every text pointed at Wednesday.",
};
