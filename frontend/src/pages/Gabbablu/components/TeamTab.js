import UserAvatar from "../../../components/UserAvatar/UserAvatar";

function TeamTab({ employees, isLoading }) {
  return (
    <div className="team-section">
      <h2 className="section-heading">The People</h2>
      {isLoading ? (
        <p className="placeholder-message">Loading team profiles...</p>
      ) : employees.length === 0 ? (
        <p className="placeholder-message">Team profiles coming soon.</p>
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
