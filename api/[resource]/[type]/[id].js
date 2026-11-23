const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

const catalogs = {
  atomic_popular_movies: { path: "/movie/popular", type: "movie" },
  atomic_now_playing: { path: "/movie/now_playing", type: "movie" },
  atomic_popular_series: { path: "/tv/popular", type: "series" },
  atomic_trending_series: { path: "/trending/tv/week", type: "series" }
};

function send(res, status, data) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(data);
}

async function tmdb(path) {
  const token = process.env.TMDB_TOKEN;

  if (!token) {
    throw new Error("TMDB_TOKEN manquant dans les variables Vercel");
  }

  const response = await fetch(`${TMDB_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`TMDB erreur HTTP ${response.status}`);
  }

  return response.json();
}

function formatMeta(item, type) {
  return {
    id: `tmdb:${item.id}`,
    type,
    name: item.title || item.name || "Sans titre",
    poster: item.poster_path
      ? `${IMAGE_BASE}/w500${item.poster_path}`
      : null,
    background: item.backdrop_path
      ? `${IMAGE_BASE}/w1280${item.backdrop_path}`
      : null,
    description: item.overview || "",
    releaseInfo: (
      item.release_date || item.first_air_date || ""
    ).slice(0, 4)
  };
}

export default async function handler(req, res) {
  try {
    const { resource, type, id } = req.query;

    if (!resource || !type || !id) {
      return send(res, 400, { error: "Paramètres manquants" });
    }

    if (resource === "catalog") {
      const catalog = catalogs[id];

      if (!catalog || catalog.type !== type) {
        return send(res, 404, { error: "Catalogue introuvable" });
      }

      const data = await tmdb(
        `${catalog.path}?language=fr-FR&page=1`
      );

      return send(res, 200, {
        metas: (data.results || []).map(item =>
          formatMeta(item, type)
        )
      });
    }

    if (resource === "meta") {
      const tmdbId = String(id).replace("tmdb:", "");
      const endpoint = type === "series" ? "tv" : "movie";

      if (!/^\d+$/.test(tmdbId)) {
        return send(res, 400, { error: "Identifiant invalide" });
      }

      const item = await tmdb(
        `/${endpoint}/${tmdbId}?language=fr-FR`
      );

      return send(res, 200, {
        meta: formatMeta(item, type)
      });
    }

    return send(res, 404, { error: "Ressource inconnue" });

  } catch (error) {
    console.error(error);
    return send(res, 500, {
      error: "Erreur du serveur",
      message: error.message
    });
  }
}
