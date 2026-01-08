-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.game_state (
  id uuid DEFAULT gen_random_uuid(),
  room_code text NOT NULL,
  game_active boolean DEFAULT false,
  is_night boolean DEFAULT false,
  nomination_target text,
  created_at timestamp with time zone DEFAULT now(),
  timer_end timestamp with time zone,
  voting_phase text DEFAULT 'closed'::text,
  current_nominee_id text,
  voting_active boolean DEFAULT false,
  votes_revealed boolean DEFAULT false,
  nominated_player text,
  votes jsonb DEFAULT '{}'::jsonb,
  timer_total_seconds integer DEFAULT 0,
  timer_running boolean DEFAULT false,
  timer_remaining_seconds integer DEFAULT 0,
  st_secret text,
  CONSTRAINT game_state_pkey PRIMARY KEY (room_code)
);
CREATE TABLE public.messages (
  id integer NOT NULL DEFAULT nextval('messages_id_seq'::regclass),
  sender_id text,
  receiver_id text,
  text text,
  created_at timestamp with time zone DEFAULT now(),
  room_code text,
  CONSTRAINT messages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.players (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_custom text UNIQUE,
  name text,
  role text DEFAULT 'Dedinčan'::text,
  fake_role text,
  is_dead boolean DEFAULT false,
  position bigint NOT NULL DEFAULT nextval('players_position_seq'::regclass),
  status_poisoned boolean DEFAULT false,
  status_protected boolean DEFAULT false,
  status_drunk boolean DEFAULT false,
  has_voted boolean DEFAULT false,
  drbna_info text,
  room_code text,
  status_grandchild boolean DEFAULT false,
  is_nominated boolean DEFAULT false,
  vote_choice text,
  vote_revealed boolean DEFAULT false,
  CONSTRAINT players_pkey PRIMARY KEY (id)
);
CREATE TABLE public.votes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  room_code text,
  voter_id text,
  vote_value boolean,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT votes_pkey PRIMARY KEY (id)
);
