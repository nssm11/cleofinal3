import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Masthead from "./components/layout/Masthead";
import Colophon from "./components/layout/Colophon";
import SearchOverlay from "./components/layout/SearchOverlay";
import { SearchProvider } from "./components/layout/SearchContext";
import HomePage from "./routes/HomePage";
import CatalogPage from "./routes/CatalogPage";
import FilmPage from "./routes/FilmPage";
import SeriesPage from "./routes/SeriesPage";
import WatchPage from "./routes/WatchPage";
import WatchlistPage from "./routes/WatchlistPage";
import HistoryPage from "./routes/HistoryPage";
import NotFoundPage from "./routes/NotFoundPage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant" in window ? ("instant" as ScrollBehavior) : "auto",
    });
  }, [pathname]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <SearchProvider>
      <ScrollToTop />
      <a className="skip-link" href="#main">
        تخطَّ إلى المحتوى
      </a>
      <Masthead />
      <main id="main" key={pathname} className="page-enter">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/film/:slug" element={<FilmPage />} />
          <Route path="/series/:slug" element={<SeriesPage />} />
          <Route path="/watch/:slug" element={<WatchPage />} />
          <Route path="/watch/:slug/:episode" element={<WatchPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Colophon />
      <SearchOverlay />
    </SearchProvider>
  );
}
