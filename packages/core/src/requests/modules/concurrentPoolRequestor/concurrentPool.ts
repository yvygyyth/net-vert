import { TaskQueue } from 'id-queue'

type Task = () => Promise<any>

type TaskItem = {
    task: Task
    resolve: (value: any) => any
    reject: (value: any) => any
}

export type TaskItemList = TaskQueue<TaskItem>

// 并发池
export class ConcurrentPool {
    parallelCount: number
    tasks: TaskItemList
    runningCount: number
    constructor(parallelCount = 4) {
        this.parallelCount = parallelCount
        this.tasks = new TaskQueue()
        this.runningCount = 0
    }
    // 加入
    add(id: string, task: Task) {
        console.log('poolinset',id,task)
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
    remove(id: string) {
        this.tasks.remove(id)
    }
    execute(currentTask: TaskItem) {
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
            const task = this.tasks.dequeue() as TaskItem
            this.runningCount++
            this.execute(task)
        }
    }
}