import UserAvatar from "../../../components/common/UserAvatar/UserAvatar";
import { useLanguage } from "../../../components/i18n/LanguageContext";

function TeamTab({ employees, isLoading }) {
  const { t } = useLanguage();
  return (
    <div className="team-section">
      <h2 className="section-heading">{t("studio.teamHeading")}</h2>
      {isLoading ? (
        <p className="placeholder-message">{t("studio.loadingTeam")}</p>
      ) : employees.length === 0 ? (
        <p className="placeholder-message">{t("studio.noTeam")}</p>
      ) : (
        <div className="team-grid">
          {employees.map((employee) => (
            <div className="team-member" key={employee.id}>
              <UserAvatar
                src={employee.img}
                alt={employee.name}
                className="team-profile-image"
              />
              <h3>{employee.name}</h3>
              <p>{employee.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeamTab;
