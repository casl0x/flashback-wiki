-- Avatar du joueur : public_id Cloudinary (upload manuel) ou URL externe
-- (ex. avatar Twitch récupéré en un clic dans l'admin).

ALTER TABLE "players" ADD COLUMN "image_url" TEXT;
