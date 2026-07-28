const NotAuthorized = () => {
  return (
    <div className="container flex flex-col items-center justify-center h-screen mx-auto text-center">
      <h2 className="text-4xl font-semibold text-red-600">
        Vous n'avez pas les autorisations requises
      </h2>
      <p className="mt-4 text-gray-600">
        Désolez nous, mais vous n'avez pas la permission d'utiliser cette page
      </p>
    </div>
  );
};

export default NotAuthorized;
