// MovieCard.tsx - Fixed with proper typing
import React from 'react';
import { IonCard, IonIcon } from '@ionic/react';
import { heart, heartOutline } from 'ionicons/icons';
import { FavoriteMovie } from '../models/FavoriteMovie';

interface MovieCardProps {
  movie: FavoriteMovie;
  isFavorite: boolean;
  onToggleFavorite: (movie: FavoriteMovie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, isFavorite, onToggleFavorite }) => {
  return (
    <IonCard className="movie-card" style={{
      width: '150px',
      backgroundColor: '#2c2c2c',
      borderRadius: '8px',
      margin: '0 5px'
    }}>
      <div style={{ position: 'relative' }}>
        {movie.poster_path && (
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className="movie-poster"
            style={{
              width: '100%',
              height: '225px',
              objectFit: 'cover',
              borderRadius: '8px'
            }}
          />
        )}
        <IonIcon
          icon={isFavorite ? heart : heartOutline}
          color={isFavorite ? 'danger' : 'light'}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            fontSize: '20px',
            cursor: 'pointer',
            zIndex: 10,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: '50%',
            padding: '2px'
          }}
          onClick={() => onToggleFavorite(movie)}
        />
      </div>
    </IonCard>
  );
};

export default MovieCard;