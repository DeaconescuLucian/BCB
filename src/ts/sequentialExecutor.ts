export class SequentialExecutor {
    private queue: (() => Promise<void>)[] = [];
    private isProcessing = false;

    async enqueue(task: () => Promise<void>): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    await task();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing) return;

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const currentTask = this.queue.shift();
            if (currentTask) {
                try {
                    await currentTask();
                } catch (error) {
                    console.error('Error in executing task:', error);
                }
            }
        }

        this.isProcessing = false;
    }
}