
export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  res.status(200).json({
    id: "com.atomic.tv.catalog",
    version: "1.0.0",
    name: "ATOMIC TV",
    description: "Catalogue français de films et séries",
    resources: ["catalog", "meta"],
    types: ["movie", "series"],
    idPrefixes: ["tmdb:"],
    catalogs: [
      {
        type: "movie",
        id: "atomic_popular_movies",
        name: "Films populaires"
      },
      {
        type: "movie",
        id: "atomic_now_playing",
        name: "Nouveautés cinéma"
      },
      {
        type: "series",
        id: "atomic_popular_series",
        name: "Séries populaires"
      },
      {
        type: "series",
        id: "atomic_trending_series",
        name: "Séries tendances"
      }
    ]
  });
}
