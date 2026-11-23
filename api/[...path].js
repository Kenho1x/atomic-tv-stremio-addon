
const { addonBuilder } = require("stremio-addon-sdk");

const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

const manifest = {
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
      name: "Films populaires",
      extra: [{ name: "search", isRequired: false }]
    },
    {
      type: "movie",
      id: "atomic_now_playing",
      name: "Nouveautés cinéma"
    },
    {
      type: "series",
      id: "atomic_popular_series",
      name: "Séries populaires",
      extra: [{ name: "search", isRequired: false }]
    },
    {
      type: "series",
      id: "atomic_trending_series",
      name: "Séries tendances"
    }
  ]
};

async function tmdb(path) {
  const token = process.env.TMDB_TOKEN;

  if (!token) {
    throw new Error("TMDB_TOKEN non configuré");
  }

  const response = await fetch(TMDB + path, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("TMDB HTTP " + response.status);
  }

  return response.json();
}

function convert(item, type) {
  const movie = type === "movie";
  const date = movie
    ? item.release_date
    : item.first_air_date;

  return {
    id: `tmdb:${item.id}`,
    type,
    name: movie ? item.title : item.name,
    poster: item.poster_path
      ? IMG + "/w500" + item.poster_path
      : undefined,
    background: item.backdrop_path
      ? IMG + "/w1280" + item.backdrop_path
      : undefined,
    description: item.overview || "",
    releaseInfo: date ? date.slice(0, 4) : undefined
  };
}

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra = {} }) => {
  const lang = "fr-FR";
  const page = Math.max(1, Number(extra.page || 1));

  let path;

  if (extra.search) {
    const q = encodeURIComponent(extra.search);

    path = type === "movie"
      ? `/search/movie?query=${q}&language=${lang}&page=${page}`
      : `/search/tv?query=${q}&language=${lang}&page=${page}`;

  } else {
    const routes = {
      atomic_popular_movies:
        `/movie/popular?language=${lang}&page=${page}`,

      atomic_now_playing:
        `/movie/now_playing?language=${lang}&page=${page}`,

      atomic_popular_series:
        `/tv/popular?language=${lang}&page=${page}`,

      atomic_trending_series:
        `/trending/tv/week?language=${lang}&page=${page}`
    };

    path = routes[id];
  }

  if (!path) return { metas: [] };

  const data = await tmdb(path);

  return {
    metas: (data.results || []).map(item =>
      convert(item, type)
    )
  };
});

builder.defineMetaHandler(async ({ type, id }) => {
  const numericId = String(id).replace(/^tmdb:/, "");

  if (!/^\d+$/.test(numericId)) {
    return { meta: null };
  }

  const path = type === "movie"
    ? `/movie/${numericId}?language=fr-FR`
    : `/tv/${numericId}?language=fr-FR`;

  const item = await tmdb(path);
  const meta = convert(item, type);

  if (item.genres) {
    meta.genres = item.genres.map(g => g.name);
  }

  return { meta };
});

const addon = builder.getInterface();

module.exports = async (req, res) => {
  const url = new URL(
    req.url,
    `https://${req.headers.host || "localhost"}`
  );

  const pathname = url.pathname.replace(/^\/api\/?/, "");
  const parts = pathname.split("/").filter(Boolean);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    if (
      parts.length === 1 &&
      parts[0] === "manifest.json"
    ) {
      return res.status(200).json(addon.manifest);
    }

    const [resource, type, rawId] = parts;
    const id = (rawId || "").replace(/\.json$/, "");

    if (
      !["catalog", "meta"].includes(resource) ||
      !type ||
      !id
    ) {
      return res.status(404).json({
        error: "Route inconnue"
      });
    }

    const result = await addon.get({
      resource,
      type,
      id,
      extra: Object.fromEntries(url.searchParams.entries())
    });

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=900, stale-while-revalidate=3600"
    );

    return res.status(200).json(result);

  } catch (error) {
    console.error("ATOMIC TV:", error);

    return res.status(500).json({
      error: "Erreur du catalogue ATOMIC TV"
    });
  }
};
