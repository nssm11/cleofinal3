/**
 * LES PORTES — the dedicated cinematic assets of the authentication scenes.
 *
 * The login frame has its OWN film — never the homepage's hero. Each asset
 * follows the house's video convention (1920×1080 desktop, 1080×1920 mobile,
 * a poster still), so a future dedicated asset for any auth scene drops in
 * here and is picked up by the page with no architecture change.
 *
 * Per the house's law, moving image belongs only to the places the cinema is
 * specified: the homepage, the universe heroes — and the door. The other auth
 * scenes (inscription, mot de passe oublié, réinitialisation) are bright,
 * letter-shaped compositions without video.
 */
export const AUTH_CINEMA = {
  login: {
    /** 1920×1080 web export — desktop and up. */
    video: "/videos/auth-login.mp4",
    /** 1080×1920 web export — handsets. */
    mobileVideo: "/videos/auth-login-mobile.mp4",
    /** The first light — first paint and the reduced-motion frame. */
    poster: "/videos/posters/auth-login.jpg",
    alt: "Lumière du matin sur une salle d'eau en marbre : verre ambré, soie dorée, crème posée sur travertin.",
  },
} as const;

export type AuthCinema = (typeof AUTH_CINEMA)[keyof typeof AUTH_CINEMA];
export type AuthCinemaKey = keyof typeof AUTH_CINEMA;
