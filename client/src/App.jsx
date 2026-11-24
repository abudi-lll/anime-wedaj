import React, { useEffect, useState, useRef, createContext, useContext } from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import {
  Search, Play, Crown, Menu, X, LogOut, ShieldCheck,
  Film, CheckCircle, ArrowRight
} from "lucide-react";
import api from "./api";
import videojs from "video.js";
import "video.js/dist/video-js.css";

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);
const money = (n) => `${Number(n || 0).toLocaleString()} ETB`;

function isActivePro(user) {
  return Boolean(
    user?.subscription?.status === "active" &&
    user?.subscription?.expiresAt &&
    new Date(user.subscription.expiresAt) > new Date()
  );
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("aw_user"));
    } catch {
      return null;
    }
  });

  const login = (data) => {
    localStorage.setItem("aw_token", data.token);
    localStorage.setItem("aw_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("aw_token");
    localStorage.removeItem("aw_user");
    setUser(null);
  };

  const refresh = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      localStorage.setItem("aw_user", JSON.stringify(data.user));
    } catch {
      logout();
    }
  };

  useEffect(() => {
    if (localStorage.getItem("aw_token")) refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="nav">
      <Link to="/" className="brand" onClick={close}>
        <span className="brand-mark">a</span>
        anime<span>-wedaj</span>
      </Link>

      <button
        className="mobile-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X /> : <Menu />}
      </button>

      <nav className={open ? "nav-links open" : "nav-links"}>
        <Link to="/" onClick={close}>Home</Link>
        <Link to="/browse" onClick={close}>Explore</Link>
        <Link to="/plans" onClick={close}>Go Pro</Link>

        {user ? (
          <>
            <Link to="/account" onClick={close}>My account</Link>
            {user.role === "admin" && (
              <Link to="/admin" onClick={close}>Admin</Link>
            )}
            <button
              className="link-button"
              onClick={() => {
                logout();
                close();
              }}
            >
              <LogOut size={15} /> Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={close}>Log in</Link>
            <Link className="nav-cta" to="/register" onClick={close}>
              Join free
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="brand">
        <span className="brand-mark">a</span>anime-wedaj
      </div>
      <p>Discover stories. Watch responsibly.</p>
      <small>
        Only content owned or authorized for distribution belongs on this platform.
      </small>
    </footer>
  );
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

function Poster({ item }) {
  const freeEpisodes = item.episodes?.some(ep => ep.isFree);
  const proEpisodes = item.episodes?.some(ep => !ep.isFree);

  let label = item.isFree ? "FREE" : "PRO";
  let tagClass = item.isFree ? "tag free" : "tag pro";

  if (item.type === "series" && item.episodes?.length) {
    if (freeEpisodes && proEpisodes) {
      label = "MIXED";
      tagClass = "tag pro";
    } else if (freeEpisodes) {
      label = "FREE";
      tagClass = "tag free";
    } else {
      label = "PRO";
      tagClass = "tag pro";
    }
  }

  return (
    <div className="poster">
      {item.posterUrl ? (
        <img src={item.posterUrl} alt={item.title} />
      ) : (
        <div className="poster-placeholder">
          <Film size={32} />
          <span>{item.title}</span>
        </div>
      )}
      <span className={tagClass}>{label}</span>
    </div>
  );
}

function AnimeCard({ item }) {
  return (
    <Link to={`/anime/${item._id}`} className="anime-card">
      <Poster item={item} />
      <div className="card-info">
        <b>{item.title}</b>
        <span>
          {item.type === "movie" ? "Movie" : "Series"}
          {item.releaseYear ? ` • ${item.releaseYear}` : ""}
        </span>
      </div>
    </Link>
  );
}

function Home() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/anime")
      .then(r => setItems(r.data.anime || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-copy">
          <span className="eyebrow">
            <Crown size={14} /> YOUR NEXT FAVORITE STORY
          </span>
          <h1>Every story<br /><em>starts here.</em></h1>
          <p>
            Explore anime worlds, discover new favorites, and enjoy a growing
            collection of stories.
          </p>
          <div className="hero-actions">
            <Link className="btn primary" to="/browse">
              <Play size={17} fill="currentColor" /> Explore anime
            </Link>
            <Link className="btn secondary" to="/plans">
              See Pro plans <ArrowRight size={16} />
            </Link>
          </div>
          <div className="hero-note">
            <span className="pulse" /> New stories are waiting to be discovered
          </div>
        </div>

        <div className="hero-art">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-core">
            <span>アニメ</span>
            <b>W</b>
            <small>ANIME · STORIES · COMMUNITY</small>
          </div>
          <div className="floating-card card-a">NEW STORIES</div>
          <div className="floating-card card-b">WATCH YOUR WAY</div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">START EXPLORING</span>
            <h2>Recently added</h2>
          </div>
          <Link to="/browse" className="text-link">
            View catalog <ArrowRight size={15} />
          </Link>
        </div>

        {items.length ? (
          <div className="anime-grid">
            {items.slice(0, 8).map(item => (
              <AnimeCard key={item._id} item={item} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Film size={30} />
            <h3>Your anime library starts here</h3>
            <p>New titles will appear when an administrator adds content.</p>
          </div>
        )}
      </section>

      <section className="pro-banner">
        <div>
          <span className="eyebrow">
            <Crown size={14} /> ANIME-WEDAJ PRO
          </span>
          <h2>More stories.<br /><em>One membership.</em></h2>
          <p>Unlock premium titles with a monthly or yearly plan.</p>
          <Link className="btn primary" to="/plans">
            Explore Pro <ArrowRight size={16} />
          </Link>
        </div>
        <div className="pro-stamp">
          <Crown size={34} />
          <b>PRO</b>
          <small>YOUR PREMIUM PASS</small>
        </div>
      </section>
    </>
  );
}

function Browse() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/anime", { params: { search: query } })
      .then(r => setItems(r.data.anime || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <section className="page section">
      <div className="page-heading">
        <span className="eyebrow">THE COLLECTION</span>
        <h1>Explore anime</h1>
        <p>Find your next favorite story.</p>
      </div>

      <div className="search-box">
        <Search />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search titles..."
        />
      </div>

      {loading ? (
        <p>Loading catalog...</p>
      ) : items.length ? (
        <div className="anime-grid">
          {items.map(item => (
            <AnimeCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search />
          <h3>No titles found</h3>
          <p>Try another search, or check back later.</p>
        </div>
      )}
    </section>
  );
}

function AnimeDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setItem(null);
    setError("");
    api.get(`/anime/${id}`)
      .then(r => setItem(r.data.anime))
      .catch(() => setError("This title could not be found."));
  }, [id]);

  if (error) {
    return <section className="page section"><p>{error}</p></section>;
  }

  if (!item) {
    return <section className="page section">Loading title...</section>;
  }

  return (
    <section className="page section detail">
      <div className="detail-poster">
        <Poster item={item} />
      </div>

      <div className="detail-copy">
        <span className="eyebrow">
          {item.type.toUpperCase()}
          {item.releaseYear ? ` • ${item.releaseYear}` : ""}
        </span>
        <h1>{item.title}</h1>

        <div className="genre-row">
          {(item.genres || []).map(g => (
            <span key={g}>{g}</span>
          ))}
        </div>

        <p>{item.synopsis || "More details coming soon."}</p>
        <VideoArea item={item} />
      </div>
    </section>
  );
}

function AnimeVideoPlayer({ src }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!src || !containerRef.current) return;

    const videoElement = document.createElement("video-js");

    videoElement.classList.add(
      "vjs-big-play-centered"
    );

    containerRef.current.appendChild(videoElement);

    const player = videojs(videoElement, {
      controls: true,
      responsive: true,
      fluid: true,
      preload: "auto",
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      controlBar: {
        volumePanel: { inline: false }
      }
    });

    playerRef.current = player;

    player.src({
      src,
      type: "video/mp4"
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [src]);

  return (
    <div
      ref={containerRef}
      className="video-js-wrapper"
    />
  );
}

function VideoArea({ item }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [remaining, setRemaining] = useState(null);
  const [loading, setLoading] = useState(false);

  const episodes = item.episodes || [];
  const pro = isActivePro(user);
  const admin = user?.role === "admin";
  const hasProAccess = pro || admin;

  const watch = async (episodeNumber) => {
    if (!user) {
      setMessage("Please log in to watch episodes.");
      setVideoUrl("");
      return;
    }

    setLoading(true);
    setMessage("");
    setVideoUrl("");

    try {
      const { data } = await api.post(`/anime/${item._id}/watch`, {
        episodeNumber
      });

      setVideoUrl(data.videoUrl);
      setRemaining(data.remainingToday);
      setSelected(episodeNumber);
    } catch (error) {
      const code = error.response?.data?.code;

      if (code === "PRO_REQUIRED") {
        setMessage("This episode is only available to Pro members.");
      } else if (code === "DAILY_LIMIT_REACHED") {
        setRemaining(0);
        setMessage(
          "You have watched your 2 free episodes today. Upgrade to Pro for unlimited viewing."
        );
      } else {
        setMessage(
          error.response?.data?.message || "Could not start video."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-wrap">
      {episodes.length > 0 ? (
        <div className="episode-list">
          <b>Episodes</b>

          {episodes.map(ep => {
            const locked = !ep.isFree && !hasProAccess;

            return (
              <button
                key={ep._id || ep.episodeNumber}
                className={
                  selected === ep.episodeNumber ? "episode active" : "episode"
                }
                disabled={loading}
                onClick={() => watch(ep.episodeNumber)}
              >
                {locked ? "🔒" : "▶"} Episode {ep.episodeNumber}: {ep.title}
                {" "}
                <small>{ep.isFree ? "FREE" : "PRO"}</small>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="movie-watch">
          <p className="muted">{item.isFree ? "Free movie" : "Pro movie"}</p>
          <button
            className="btn primary"
            disabled={loading}
            onClick={() => watch(0)}
          >
            <Play size={17} /> Watch movie
          </button>
        </div>
      )}

      {loading && <p>Preparing your video...</p>}

      {message && (
        <div className="locked">
          <Crown />
          <p>{message}</p>
          {!user ? (
            <Link className="btn primary" to="/login">Log in</Link>
          ) : !hasProAccess ? (
            <Link className="btn primary" to="/plans">Upgrade to Pro</Link>
          ) : null}
        </div>
      )}

      {videoUrl && (
        <div className="video-frame">
          <AnimeVideoPlayer src={videoUrl} />
        </div>
      )}

      {remaining !== null && (
        <p className="muted">
          Free episodes remaining today: {remaining}
        </p>
      )}
    </div>
  );
}

function Plans() {
  return (
    <section className="page section">
      <div className="page-heading center">
        <span className="eyebrow">
          <Crown size={14} /> CHOOSE YOUR EXPERIENCE
        </span>
        <h1>Simple plans. <em>More anime.</em></h1>
        <p>Start free, then upgrade when you're ready.</p>
      </div>

      <div className="plans-grid">
        <div className="plan-card">
          <span className="eyebrow">FREE</span>
          <h2>Free</h2>
          <div className="price">0 <small>ETB</small></div>
          <p>Explore the platform and watch free episodes.</p>
          <ul>
            <li><CheckCircle /> Two free episodes per day</li>
            <li><CheckCircle /> Browse and search</li>
            <li><CheckCircle /> Personal account</li>
          </ul>
          <Link className="btn secondary full" to="/register">
            Create free account
          </Link>
        </div>

        <div className="plan-card featured">
          <span className="plan-ribbon">POPULAR</span>
          <span className="eyebrow">ANIME-WEDAJ PRO</span>
          <h2>Monthly</h2>
          <div className="price">199 <small>ETB / month</small></div>
          <p>Premium access with monthly flexibility.</p>
          <ul>
            <li><CheckCircle /> Pro titles</li>
            <li><CheckCircle /> Unlimited episode viewing</li>
            <li><CheckCircle /> Support the platform</li>
          </ul>
          <Link className="btn primary full" to="/subscribe/monthly">
            Choose monthly
          </Link>
        </div>

        <div className="plan-card">
          <span className="eyebrow">SAVE WITH YEARLY</span>
          <h2>Yearly</h2>
          <div className="price">1,699 <small>ETB / year</small></div>
          <p>One payment for a full year of Pro.</p>
          <ul>
            <li><CheckCircle /> All monthly Pro benefits</li>
            <li><CheckCircle /> 12-month access</li>
            <li><CheckCircle /> One yearly payment</li>
          </ul>
          <Link className="btn secondary full" to="/subscribe/yearly">
            Choose yearly
          </Link>
        </div>
      </div>

      <p className="fine-print">
        Pro access is activated only after an administrator verifies payment.
      </p>
    </section>
  );
}

function Subscribe() {
  const { plan } = useParams();
  const { user } = useAuth();
  const [method, setMethod] = useState("telebirr");
  const [tx, setTx] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const validPlan = plan === "monthly" || plan === "yearly";
  const amount = plan === "yearly" ? 1699 : 199;

  const config = {
    telebirr: import.meta.env.VITE_TELEBIRR_NUMBER ||
      "Ask admin for the Telebirr number",
    bank: import.meta.env.VITE_BANK_DETAILS ||
      "Ask admin for bank details"
  };

  if (!validPlan) {
    return (
      <section className="page section">
        <h1>Invalid plan</h1>
        <Link to="/plans">Return to plans</Link>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="page section narrow">
        <div className="form-card">
          <h2>Log in to subscribe</h2>
          <p>You need an account before submitting payment.</p>
          <Link className="btn primary full" to="/login">Log in</Link>
        </div>
      </section>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!file) {
      setMessage("Please attach your payment receipt screenshot.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("The receipt image must be 5 MB or smaller.");
      return;
    }

    const fd = new FormData();
    fd.append("plan", plan);
    fd.append("paymentMethod", method);
    fd.append("transactionId", tx.trim());
    fd.append("receipt", file);

    setBusy(true);

    try {
      const { data } = await api.post("/payments", fd);
      setMessage(data.message || "Payment submitted for verification.");
      setTx("");
      setFile(null);
      e.target.reset();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not submit. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="page section narrow">
      <div className="page-heading">
        <span className="eyebrow">PRO MEMBERSHIP</span>
        <h1>Complete your payment</h1>
        <p>
          {plan === "yearly" ? "Yearly" : "Monthly"} plan ·
          <b> {money(amount)}</b>
        </p>
      </div>

      <form className="form-card" onSubmit={submit}>
        <div className="payment-instructions">
          <b>1. Pay {money(amount)}</b>
          <p>
            Choose a payment method. Confirm the account details with the
            platform administrator before sending money.
          </p>
        </div>

        <label className="field-label">
          Payment method
          <select value={method} onChange={e => setMethod(e.target.value)}>
            <option value="telebirr">Telebirr</option>
            <option value="bank">Bank transfer</option>
          </select>
        </label>

        <div className="account-detail">
          <small>
            {method === "telebirr" ? "TELEBIRR NUMBER" : "BANK ACCOUNT DETAILS"}
          </small>
          <b>{config[method]}</b>
          <span>Payment details are configured by the administrator.</span>
        </div>

        <label className="field-label">
          2. Transaction / reference number
          <input
            required
            value={tx}
            onChange={e => setTx(e.target.value)}
            placeholder="Enter transaction reference"
          />
        </label>

        <label className="field-label">
          3. Upload receipt screenshot
          <input
            required
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          <small>JPG, PNG or WEBP · maximum 5 MB</small>
        </label>

        <button disabled={busy} className="btn primary full">
          {busy ? "Submitting..." : "Submit for verification"}
        </button>

        {message && <div className="notice">{message}</div>}

        <p className="fine-print">
          Do not upload passwords, PINs, or one-time codes. Confirm the
          recipient details before sending money.
        </p>
      </form>
    </section>
  );
}

function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data);
      nav(data.user.role === "admin" ? "/admin" : "/");
    } catch (error) {
      setError(error.response?.data?.message || "Login failed.");
    }
  };

  return (
    <AuthForm
      title="Welcome back"
      subtitle="Log in to continue your anime journey."
      submit={submit}
      error={error}
    >
      <label className="field-label">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </label>

      <label className="field-label">
        Password
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </label>

      <button className="btn primary full">Log in</button>
      <p className="form-bottom">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </AuthForm>
  );
}

function Register() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { data } = await api.post("/auth/register", {
        name, email, password
      });
      login(data);
      nav("/");
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <AuthForm
      title="Join anime-wedaj"
      subtitle="Create your free account."
      submit={submit}
      error={error}
    >
      <label className="field-label">
        Your name
        <input
          required
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </label>

      <label className="field-label">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </label>

      <label className="field-label">
        Password
        <input
          type="password"
          minLength="8"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </label>

      <button className="btn primary full">Create account</button>
      <p className="form-bottom">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </AuthForm>
  );
}

function AuthForm({ title, subtitle, submit, error, children }) {
  return (
    <section className="page section narrow">
      <form className="form-card" onSubmit={submit}>
        <span className="eyebrow">ANIME-WEDAJ ACCOUNT</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
        {error && <div className="notice error">{error}</div>}
      </form>
    </section>
  );
}

function Account() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get("/payments/my")
      .then(r => setPayments(r.data.payments || []))
      .catch(() => setPayments([]));
  }, []);

  const active = isActivePro(user);

  return (
    <section className="page section narrow">
      <div className="page-heading">
        <span className="eyebrow">YOUR SPACE</span>
        <h1>Hello, {user?.name}</h1>
        <p>Manage your membership and payment requests.</p>
      </div>

      <div className="account-panel">
        <div>
          <small>MEMBERSHIP STATUS</small>
          <h2>{active ? "Anime-wedaj Pro" : "Free member"}</h2>
          <p>
            {active
              ? `Your access expires ${new Date(
                user.subscription.expiresAt
              ).toLocaleDateString()}`
              : "Choose a Pro plan to unlock premium titles."}
          </p>
        </div>
        <Crown size={34} />
        {!active && (
          <Link className="btn primary" to="/plans">Explore Pro</Link>
        )}
      </div>

      <h2 className="subheading">Payment requests</h2>

      {payments.length ? payments.map(p => (
        <div className="payment-row" key={p._id}>
          <div>
            <b>{p.plan} · {money(p.amount)}</b>
            <small>{p.paymentMethod} · {p.transactionId}</small>
          </div>
          <span className={`status ${p.status}`}>{p.status}</span>
        </div>
      )) : (
        <p className="muted">No payment requests yet.</p>
      )}
    </section>
  );
}

async function openPrivateReceipt(paymentId) {
  try {
    const response = await api.get(
      `/admin/payments/${paymentId}/receipt`,
      { responseType: "blob" }
    );

    const url = URL.createObjectURL(response.data);
    const tab = window.open(url, "_blank", "noopener,noreferrer");

    if (!tab) {
      const link = document.createElement("a");
      link.href = url;
      link.download = "payment-receipt";
      link.click();
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    alert("Could not load receipt. Please sign in again.");
  }
}

const emptyAnimeForm = {
  title: "", synopsis: "", posterUrl: "", bannerUrl: "", genres: "",
  releaseYear: "", type: "series", videoUrl: "", isFree: true,
  published: true, episodes: []
};

function toAnimeForm(anime) {
  return {
    title: anime.title || "",
    synopsis: anime.synopsis || "",
    posterUrl: anime.posterUrl || "",
    bannerUrl: anime.bannerUrl || "",
    genres: Array.isArray(anime.genres) ? anime.genres.join(", ") : (anime.genres || ""),
    releaseYear: anime.releaseYear || "",
    type: anime.type || "series",
    videoUrl: anime.videoUrl || "",
    isFree: anime.isFree ?? true,
    published: anime.published ?? false,
    episodes: (anime.episodes || []).map((ep, index) => ({
      title: ep.title || `Episode ${index + 1}`,
      episodeNumber: ep.episodeNumber || index + 1,
      videoUrl: ep.videoUrl || "",
      isFree: ep.isFree ?? true
    }))
  };
}

function Admin() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [animeList, setAnimeList] = useState([]);
  const [notes, setNotes] = useState({});
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ ...emptyAnimeForm });
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [o, p, u, a] = await Promise.all([
      api.get("/admin/overview"),
      api.get("/admin/payments"),
      api.get("/admin/users"),
      api.get("/admin/anime")
    ]);
    setOverview(o.data);
    setPayments(p.data.payments || []);
    setUsers(u.data.users || []);
    setAnimeList(a.data.anime || []);
  };

  useEffect(() => {
    if (user?.role === "admin") {
      load().catch(error => setMessage(
        error.response?.data?.message || "Could not load admin data."
      ));
    }
  }, [user]);

  const resetForm = () => {
    setForm({ ...emptyAnimeForm, episodes: [] });
    setEditingId(null);
  };

  const review = async (id, decision) => {
    try {
      await api.patch(`/admin/payments/${id}`, {
        decision, adminNote: notes[id] || ""
      });
      setMessage(`Payment ${decision}.`);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Payment review failed.");
    }
  };

  const updateEpisode = (index, field, value) => {
    setForm(current => ({
      ...current,
      episodes: current.episodes.map((ep, i) =>
        i === index ? { ...ep, [field]: value } : ep
      )
    }));
  };



  const uploadVideo = async (onSuccess) => {
    try {
      setMessage("");

      const timestamp = Math.floor(Date.now() / 1000);

      const configResponse = await api.post(
        "/admin/anime/upload-signature",
        { timestamp, source: "uw" }
      );

      const { apiKey, cloudName } = configResponse.data;

      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName,
          apiKey,
          resourceType: "video",
          sources: ["local"],
          multiple: false,
          folder: "anime-wedaj/videos",
          clientAllowedFormats: ["mp4", "mov", "mkv", "webm"],
          maxFileSize: 5000000000,
          maxChunkSize: 20000000,

          uploadSignature: (callback, paramsToSign) => {
            api.post("/admin/anime/upload-signature", {
              timestamp: paramsToSign.timestamp,
              source: "uw"
            })
              .then(response => callback(response.data.signature))
              .catch(() => {
                setMessage("Could not generate upload signature.");
              });
          }
        },
        (error, result) => {
          if (error) {
            setMessage(error.message || "Video upload failed.");
            return;
          }

          if (result?.event === "success") {
            onSuccess(result.info.secure_url);
            setMessage("Video uploaded successfully.");
          }
        }
      );

      widget.open();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not start video upload."
      );
    }
  };



  const addEpisode = () => {
    setForm(current => ({
      ...current,
      episodes: [...current.episodes, {
        title: `Episode ${current.episodes.length + 1}`,
        episodeNumber: current.episodes.length + 1,
        videoUrl: "", isFree: true
      }]
    }));
  };

  const removeEpisode = index => {
    setForm(current => ({
      ...current,
      episodes: current.episodes.filter((_, i) => i !== index)
        .map((ep, i) => ({ ...ep, episodeNumber: i + 1 }))
    }));
  };

  const saveAnime = async e => {
    e.preventDefault();
    setMessage("");
    if (form.type === "movie" && !form.videoUrl.trim()) {
      setMessage("Please enter the movie video URL."); return;
    }
    if (form.type === "series" && (!form.episodes.length || form.episodes.some(ep => !ep.videoUrl.trim() || !ep.title.trim()))) {
      setMessage("Add at least one episode and enter a title and video URL for every episode."); return;
    }
    const payload = {
      ...form,
      genres: typeof form.genres === "string" ? form.genres.split(",").map(g => g.trim()).filter(Boolean) : form.genres,
      releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
      episodes: form.type === "series" ? form.episodes : [],
      videoUrl: form.type === "movie" ? form.videoUrl.trim() : ""
    };
    setBusy(true);
    try {
      if (editingId) {
        await api.put(`/admin/anime/${editingId}`, payload);
        setMessage("Anime updated successfully.");
      } else {
        await api.post("/admin/anime", payload);
        setMessage("Anime added to catalog.");
      }
      resetForm();
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save anime.");
    } finally { setBusy(false); }
  };

  const editAnime = anime => {
    setForm(toAnimeForm(anime));
    setEditingId(anime._id);
    setMessage(`Editing: ${anime.title}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteAnime = async anime => {
    const confirmed = window.confirm(`Delete “${anime.title}”? This cannot be undone.`);
    if (!confirmed) return;
    setBusy(true);
    try {
      await api.delete(`/admin/anime/${anime._id}`);
      if (editingId === anime._id) resetForm();
      setMessage(`Deleted ${anime.title}.`);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not delete anime.");
    } finally { setBusy(false); }
  };

  if (user?.role !== "admin") {
    return <section className="page section"><h1>Admin access required</h1></section>;
  }

  return (
    <section className="page section admin-page">
      <div className="page-heading">
        <span className="eyebrow"><ShieldCheck size={14} /> CONTROL CENTER</span>
        <h1>Admin dashboard</h1>
        <p>Welcome, {user.name}. Verify real payments before approving Pro access.</p>
      </div>
      {message && <div className="notice">{message}</div>}
      {overview && <div className="stats-grid">
        {[["Users", overview.users], ["Anime titles", overview.anime], ["Pending payments", overview.pendingPayments], ["Approved payments", overview.approvedPayments]].map(([label, value]) =>
          <div className="stat" key={label}><small>{label}</small><b>{value ?? 0}</b></div>
        )}
      </div>}

      <div className="admin-grid">
        <div className="admin-main">
          <h2>Payment verification</h2>
          {payments.length ? payments.map(p => <div className="admin-payment" key={p._id}>
            <div className="payment-top"><div><b>{p.user?.name || "Unknown user"}</b><small>{p.user?.email}</small></div><span className={`status ${p.status}`}>{p.status}</span></div>
            <div className="payment-meta"><span>{p.plan} · {money(p.amount)}</span><span>{p.paymentMethod}</span><span>Ref: {p.transactionId}</span></div>
            <button type="button" className="text-link receipt-link" onClick={() => openPrivateReceipt(p._id)}>View private receipt image ↗</button>
            {p.status === "pending" && <>
              <textarea placeholder="Optional admin note" value={notes[p._id] || ""} onChange={e => setNotes(current => ({ ...current, [p._id]: e.target.value }))} />
              <div className="button-row">
                <button type="button" className="btn primary" disabled={busy} onClick={() => review(p._id, "approved")}>Approve after verifying</button>
                <button type="button" className="btn danger" disabled={busy} onClick={() => review(p._id, "rejected")}>Reject</button>
              </div>
            </>}
          </div>) : <p className="muted">No payment requests.</p>}
        </div>

        <aside className="admin-side">
          <h2>{editingId ? "Edit anime title" : "Add anime title"}</h2>
          <form className="admin-form" onSubmit={saveAnime}>
            <label className="field-label">Title<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
            <label className="field-label">Synopsis<textarea value={form.synopsis} onChange={e => setForm({ ...form, synopsis: e.target.value })} /></label>
            <label className="field-label">Poster image URL<input value={form.posterUrl} onChange={e => setForm({ ...form, posterUrl: e.target.value })} placeholder="https://..." /></label>
            <label className="field-label">Banner image URL<input value={form.bannerUrl} onChange={e => setForm({ ...form, bannerUrl: e.target.value })} /></label>
            <label className="field-label">Genres (comma separated)<input value={form.genres} onChange={e => setForm({ ...form, genres: e.target.value })} /></label>
            <label className="field-label">Release year<input type="number" value={form.releaseYear} onChange={e => setForm({ ...form, releaseYear: e.target.value })} /></label>
            <label className="field-label">Type<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, episodes: [], videoUrl: "" })}><option value="series">Series</option><option value="movie">Movie</option></select></label>
            {form.type === "movie" ? <>

              <label className="field-label">
                Movie video URL
                <input
                  required
                  value={form.videoUrl}
                  onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder="Paste video URL or upload below"
                />
              </label>

              <button
                type="button"
                className="btn secondary"
                disabled={busy}
                onClick={() => uploadVideo(url =>
                  setForm(current => ({ ...current, videoUrl: url }))
                )}
              >
                Upload movie from computer
              </button>

              <label className="check-label"><input type="checkbox" checked={form.isFree} onChange={e => setForm({ ...form, isFree: e.target.checked })} /> Free movie (unchecked = Pro only)</label>
            </> : <div className="episode-editor">
              <div className="section-heading"><h3>Series episodes</h3><button type="button" className="btn secondary" onClick={addEpisode}>+ Add episode</button></div>
              {!form.episodes.length && <p className="muted">Add episodes below. Each episode can be Free or Pro.</p>}
              {form.episodes.map((ep, index) => <div className="episode-edit-card" key={index}>
                <div className="payment-top"><b>Episode {ep.episodeNumber}</b><button type="button" className="text-link" onClick={() => removeEpisode(index)}>Remove</button></div>
                <label className="field-label">Episode title<input required value={ep.title} onChange={e => updateEpisode(index, "title", e.target.value)} /></label>

                <label className="field-label">
                  Video URL
                  <input
                    required
                    value={ep.videoUrl}
                    onChange={e => updateEpisode(index, "videoUrl", e.target.value)}
                    placeholder="Paste video URL or upload below"
                  />
                </label>

                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => uploadVideo(url =>
                    updateEpisode(index, "videoUrl", url)
                  )}
                >
                  Upload episode from computer
                </button>

                <label className="check-label"><input type="checkbox" checked={ep.isFree} onChange={e => updateEpisode(index, "isFree", e.target.checked)} /> Free episode (unchecked = Pro only)</label>
              </div>)}
            </div>}
            <label className="check-label"><input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} /> Publish this title</label>
            <div className="button-row">
              <button className="btn primary full" disabled={busy}>{busy ? "Saving..." : editingId ? "Save changes" : "Add title"}</button>
              {editingId && <button type="button" className="btn secondary" disabled={busy} onClick={resetForm}>Cancel edit</button>}
            </div>
          </form>
          <p className="fine-print">Add only video content you own or are authorized to distribute. Episode access is checked by the server.</p>
        </aside>
      </div>

      <h2 className="subheading">Manage anime catalog</h2>
      {animeList.length ? <div className="user-list">{animeList.map(anime => <div className="payment-row" key={anime._id}>
        <div className="row" style={{ gap: 12, alignItems: "center" }}>
          {anime.posterUrl && <img src={anime.posterUrl} alt="" style={{ width: 48, height: 64, objectFit: "cover", borderRadius: 6 }} />}
          <div><b>{anime.title}</b><small>{anime.type} · {anime.published ? "Published" : "Draft"} · {(anime.episodes || []).length} episodes</small></div>
        </div>
        <div className="button-row">
          <button type="button" className="btn secondary" disabled={busy} onClick={() => editAnime(anime)}>Edit</button>
          <button type="button" className="btn danger" disabled={busy} onClick={() => deleteAnime(anime)}>Delete</button>
        </div>
      </div>)}</div> : <p className="muted">No anime titles yet.</p>}

      <h2 className="subheading">Recent users</h2>
      <div className="user-list">{users.slice(0, 10).map(member => <div className="payment-row" key={member._id}><div><b>{member.name}</b><small>{member.email}</small></div><span className="muted">{member.role}</span></div>)}</div>
    </section>
  );
}

function Protected({ children }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <section className="page section narrow">
        <div className="form-card">
          <h2>Log in required</h2>
          <p>Please log in to continue.</p>
          <Link className="btn primary full" to="/login">Log in</Link>
        </div>
      </section>
    );
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/anime/:id" element={<AnimeDetail />} />
          <Route path="/plans" element={<Plans />} />
          <Route
            path="/subscribe/:plan"
            element={<Protected><Subscribe /></Protected>}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/account"
            element={<Protected><Account /></Protected>}
          />
          <Route
            path="/admin"
            element={<Protected><Admin /></Protected>}
          />
          <Route
            path="*"
            element={
              <section className="page section">
                <h1>Page not found</h1>
                <Link to="/">Return home</Link>
              </section>
            }
          />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}