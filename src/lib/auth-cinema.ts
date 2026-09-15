/**
 * LES PORTES — the dedicated cinematic assets of the authentication scenes.
 *
 * The login frame has its OWN film — never the homepage's hero. Each asset
 * follows the house's video convention (a 1920×1080 master, a mobile export
 * when one exists, and a poster still), so a future dedicated asset for any
 * auth scene drops in here and is picked up by the page with no architecture
 * change.
 *
 * Per the house's law, moving image belongs only to the places the cinema is
 * specified: the homepage, the universe heroes — and the door. The other auth
 * scenes (inscription, mot de passe oublié, réinitialisation) are bright,
 * letter-shaped compositions without video.
 */
export const AUTH_CINEMA = {
  login: {
    /** 1920×1080 master — the house's own login film. */
    video: "/videos/login.mp4",
    /** No separate mobile export exists — the 16:9 master covers handsets (object-cover). */
    mobileVideo: "/videos/login.mp4",
    /** First light — first paint and the reduced-motion frame. */
    poster: "/videos/posters/login.jpg",
    alt: "Lumière du matin dans une salle de bain en travertin : miroir rond, robinetterie dorée, soie blanche.",
  },
} as const;

export type AuthCinema = (typeof AUTH_CINEMA)[keyof typeof AUTH_CINEMA];
export type AuthCinemaKey = keyof typeof AUTH_CINEMA;
