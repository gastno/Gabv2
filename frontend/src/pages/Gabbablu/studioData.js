import { getAssetUrl } from "../../services/api";

export const STUDIO_DEFAULTS = {
  1: {
    name: "Gabbablu",
    location: "Reykjavík, Iceland",
    about_description: "",
    logo: "/gabbablulogo.png",
    portfolio: "gabbablu",
  },
  2: {
    name: "Amor Tattoo",
    location: "Reykjavík, Iceland",
    about_description: "",
    logo: "/amortattoo.png",
    portfolio: "amortattoo",
  },
};

export const toTeamMember = (person) => ({
  id: person.id,
  name: person.name || person.full_name || "Team member",
  title: person.description || "Studio specialist",
  img: getAssetUrl(person.avatar_url),
});
