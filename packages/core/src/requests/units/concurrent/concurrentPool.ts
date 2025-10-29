import { TaskQueue } from 'id-queue'
import type { Id } from './type'


type Task<T> = () => Promise<T>

type TaskItem<T> = {
    task: Task<T>
    resolve: (value: T) => void
    reject: (reason: any) => void
}

export type TaskItemList<T> = TaskQueue<TaskItem<T>>

// 并发池
export class ConcurrentPool<T extends any = any> {
    parallelCount: number
    tasks: TaskItemList<T>
    runningCount: number
    constructor(parallelCount = 4) {
        this.parallelCount = parallelCount
        this.tasks = new TaskQueue()
        this.runningCount = 0
    }
    // 加入
    add(id: Id, task: Task<T>) {
        return new Promise((resolve, reject) => {
            this.tasks.enqueue(id, {
                task,
                resolve,
                reject
            })
            this._run()
        })
    }
    // 删除
    remove(id: Id) {
        this.tasks.remove(id)
    }
    execute(currentTask: TaskItem<T>) {
        const { task, resolve, reject } = currentTask
        return task()
            .then(resolve)
            .catch(reject)
            .finally(() => {
                this.runningCount--
                this._run()
            })
    }
    _run() {
        while (this.runningCount < this.parallelCount && this.tasks.size > 0) {
            const task = this.tasks.dequeue() as TaskItem<T>
            this.runningCount++
            this.execute(task)
        }
    }
}