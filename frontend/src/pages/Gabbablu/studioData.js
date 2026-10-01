import { getAssetUrl } from "../../services/api";

export const STUDIO_DEFAULTS = {
  1: {
    name: "Gabbablu",
    location: "Placeholder Street 123, Reykjavík, Iceland",
    about_description: "Studio information coming soon.",
    logo: "/gabbablulogo.png",
    portfolio: "gabbablu",
  },
  2: {
    name: "Amor Tattoo",
    location: "Placeholder Street 123, Reykjavík, Iceland",
    about_description: "Studio information coming soon.",
    logo: "/amortattoo.png",
    portfolio: "amortattoo",
  },
};

export const toTeamMember = (person) => ({
  id: person.id,
  name: person.name || person.full_name || "Team member",
  title: person.description || "Profile details coming soon.",
  img: getAssetUrl(person.avatar_url) || "/placeholder-person-1.jpg",
});
