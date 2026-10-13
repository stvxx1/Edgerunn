import React from 'react';
import { HUDState } from '../types';
import { MissionBoard } from './MissionBoard';

interface GigGeneratorProps {
  hudState: HUDState;
  onSelectGig: (prompt: string) => void;
}

export const GigGenerator: React.FC<GigGeneratorProps> = ({ hudState, onSelectGig }) => {
  return <MissionBoard hudState={hudState} onSelectGig={onSelectGig} />;
};

export default GigGenerator;
