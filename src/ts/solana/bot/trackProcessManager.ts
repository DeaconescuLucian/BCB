import TrackProcess from './trackProcess';

export interface ITrackProcessManager {
  trackProcesses: Map<string, TrackProcess>;
  register(id: string, trackProcess: TrackProcess): void;
  remove(id: string): void;
  removeAll(): void;
  removePosition(trackProcessId: string, positionId: string): void;
  removePool(trackProcessId: string, positionId: string): void;
}

export default class TrackProcessManager implements ITrackProcessManager {
  trackProcesses: Map<string, TrackProcess>;
  constructor() {
    this.trackProcesses = new Map<string, TrackProcess>();
  }
  register(id: string, trackProcess: TrackProcess): void {
    try {
        this.trackProcesses.set(id, trackProcess);
    }
    catch(error) {
        console.error(error);
    }

  }
  async remove(id: string): Promise<void> {
    await this.trackProcesses.get(id)?.stopProcess();
    this.trackProcesses.delete(id);
    return;
  }
  removeAll(): void {
    this.trackProcesses.forEach(async (trackProcess) => await trackProcess.stopProcess());
    this.trackProcesses.clear();
  }
  removePosition(trackProcessId: string, positionId: string): void {
    throw new Error('Method not implemented.');
  }
  removePool(trackProcessId: string, pooolId: string): void {
    throw new Error('Method not implemented.');
  }
}
