export const categories = [
  "Web Development",
  "Graphic Design",
  "Video Editing",
  "Data Entry",
  "Content Writing",
  "Digital Marketing",
  "Data Science",
];

export const demoBanner =
  "Illustrative profiles and projects below are demo content, not live user listings.";

export const freelancers = [
  { id: "demo-1", name: "Aarav Mehta", role: "Full-stack developer", location: "Pune, India", skills: ["React", "Next.js", "Node.js"], rate: 38, currency: "USD", rating: 4.9, reviews: 28, portfolio: "Portfolio example · demo", experience: "Expert", initials: "AM", color: "from-blue-500 to-indigo-500" },
  { id: "demo-2", name: "Maya Shah", role: "Brand & product designer", location: "Mumbai, India", skills: ["Figma", "Branding", "UI/UX"], rate: 32, currency: "USD", rating: 5.0, reviews: 19, portfolio: "Portfolio example · demo", experience: "Expert", initials: "MS", color: "from-pink-500 to-rose-500" },
  { id: "demo-3", name: "Ishaan Rao", role: "Motion & video editor", location: "Bengaluru, India", skills: ["Premiere Pro", "After Effects", "Reels"], rate: 28, currency: "USD", rating: 4.8, reviews: 34, portfolio: "Portfolio example · demo", experience: "Intermediate", initials: "IR", color: "from-amber-500 to-orange-500" },
];

export const projects = [
  { id: "demo-project-1", title: "Build a conversion-focused ecommerce storefront", description: "Create a responsive storefront with a polished checkout experience, product filtering, and a lightweight admin handoff.", category: "Web Development", budget: 1800, currency: "USD" as const, deadline: "3 weeks", requirements: ["Next.js", "TypeScript", "Responsive design"], skills: ["Next.js", "TypeScript", "Responsive design"], proposals: 12, status: "open" },
  { id: "demo-project-2", title: "Refresh our visual identity and brand kit", description: "Design a memorable visual system for a growing sustainable skincare brand, including social templates and usage guidelines.", category: "Graphic Design", budget: 95000, currency: "INR" as const, deadline: "2 weeks", requirements: ["Brand identity", "Figma", "Packaging"], skills: ["Brand identity", "Figma", "Packaging"], proposals: 8, status: "open" },
  { id: "demo-project-3", title: "Edit a series of founder-led product videos", description: "Shape six short, captioned social videos from supplied footage, with a consistent visual rhythm and sound mix.", category: "Video Editing", budget: 720, currency: "EUR" as const, deadline: "10 days", requirements: ["Video editing", "Captions", "Social media"], skills: ["Video editing", "Captions", "Social media"], proposals: 6, status: "open" },
];

export const processSteps = [
  { title: "Create your profile", description: "Share your skills, experience and the kind of work you do best." },
  { title: "Find the right fit", description: "Discover projects or people that match your goals and expertise." },
  { title: "Work together", description: "Agree on scope, keep conversations clear, and build great work." },
];

export const testimonials = [
  { quote: "Demo testimonial: A clear project brief helped our small team find the right specialist.", name: "Demo client", role: "Illustrative marketplace example" },
  { quote: "Demo testimonial: A complete profile makes it easier to show what you can do.", name: "Demo freelancer", role: "Illustrative marketplace example" },
];
