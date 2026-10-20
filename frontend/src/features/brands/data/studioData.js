import { getAssetUrl } from "../../../services/api";

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

export const toTeamMember = (person, language = "en") => ({
  id: person.id,
  name: person.name || person.full_name || (language === "is" ? "Starfsmaður" : "Team member"),
  title: person[`description_${language}`] || person.description_en || person.description
    || (language === "is" ? "Sérfræðingur stofunnar" : "Studio specialist"),
  img: getAssetUrl(person.avatar_url),
});
