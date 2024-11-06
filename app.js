const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const cors = require('cors')

const app = express()
const port = 3000

app.use(cors())
app.use(bodyParser.json())

const projectsFilePath = path.join(__dirname, 'projects.json')
const tasksFilePath = path.join(__dirname, 'tasks.json')

// POST /projects: 새 프로젝트 생성
app.post('/projects', (req, res) => {
    const { title, description } = req.body

    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required.' })
    }

    let projects = []
    if (fs.existsSync(projectsFilePath)) {
        const data = fs.readFileSync(projectsFilePath)
        projects = JSON.parse(data)
    }

    const newProjectId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1
    const newProject = {
        id: newProjectId,
        title,
        description,
        tasks: []
    }

    projects.push(newProject)
    fs.writeFileSync(projectsFilePath, JSON.stringify(projects, null, 2))

    return res.status(201).json(newProject)
})

// GET /projects: 모든 프로젝트 조회
app.get('/projects', (req, res) => {
    let projects = []
    if (fs.existsSync(projectsFilePath)) {
        const data = fs.readFileSync(projectsFilePath)
        projects = JSON.parse(data)
    }

    return res.status(200).json(projects)
})

// GET /projects/:projectId: 특정 프로젝트 조회
app.get('/projects/:projectId', (req, res) => {
    const { projectId } = req.params

    let projects = []
    if (fs.existsSync(projectsFilePath)) {
        const data = fs.readFileSync(projectsFilePath)
        projects = JSON.parse(data)
    }

    const project = projects.find(p => p.id == projectId)
    if (!project) {
        return res.status(404).json({ message: 'Project not found.' })
    }

    return res.status(200).json(project)
})

// DELETE /projects/:projectId: 특정 프로젝트 삭제
app.delete('/projects/:projectId', (req, res) => {
    const { projectId } = req.params

    let projects = []
    if (fs.existsSync(projectsFilePath)) {
        const data = fs.readFileSync(projectsFilePath)
        projects = JSON.parse(data)
    }

    const projectIndex = projects.findIndex(p => p.id == projectId)
    if (projectIndex === -1) {
        return res.status(404).json({ message: 'Project not found.' })
    }

    const project = projects[projectIndex]
    if (project.tasks.length > 0) {
        return res.status(400).json({ message: 'Cannot delete project because it has tasks.' })
    }

    projects.splice(projectIndex, 1)
    fs.writeFileSync(projectsFilePath, JSON.stringify(projects, null, 2))

    return res.status(200).json({ message: 'Project successfully deleted.' })
})

// POST /projects/:projectId/tasks: 프로젝트에 태스크 추가
app.post('/projects/:projectId/tasks', (req, res) => {
    const { projectId } = req.params
    const { pjId, title, description, priority, dueDate, status } = req.body

    if (parseInt(projectId) !== pjId) {
        return res.status(400).json({ message: 'Project ID in URL and body must match.' })
    }

    if (!title || !description || !priority || !dueDate || !status) {
        return res.status(400).json({ message: 'Title, description, priority, dueDate and status are required.' })
    }

    const validPriorities = ['high', 'medium', 'low']
    const validStatuses = ['not-started', 'in-progress', 'done']
    
    if (!validPriorities.includes(priority)) {
        return res.status(400).json({ message: 'Priority must be one of the following: high, medium, low.' })
    }

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Status must be one of the following: not-started, in-progress, done.' })
    }

    let tasks = []
    if (fs.existsSync(tasksFilePath)) {
        const data = fs.readFileSync(tasksFilePath)
        tasks = JSON.parse(data)
    }

    const newTaskId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1
    const newTask = {
        pjId,
        id: newTaskId,
        title,
        description,
        priority,
        dueDate,
        status
    }

    tasks.push(newTask)
    fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2))

    let projects = []
    if (fs.existsSync(projectsFilePath)) {
        const data = fs.readFileSync(projectsFilePath)
        projects = JSON.parse(data)
    }

    const project = projects.find(p => p.id == projectId)
    if (!project) {
        return res.status(404).json({ message: 'Project not found.' })
    }

    project.tasks.push(newTaskId)
    fs.writeFileSync(projectsFilePath, JSON.stringify(projects, null, 2))

    return res.status(201).json(newTask)
})

// GET /projects/:projectId/tasks: 특정 프로젝트의 모든 태스크 조회
app.get('/projects/:projectId/tasks', (req, res) => {
    const { projectId } = req.params

    let tasks = []
    if (fs.existsSync(tasksFilePath)) {
        const data = fs.readFileSync(tasksFilePath)
        tasks = JSON.parse(data)
    }

    const projectTasks = tasks.filter(t => t.pjId == projectId)

    return res.status(200).json(projectTasks)
})

// PUT /projects/:projectId/tasks/:taskId: 특정 태스크 수정
app.put('/projects/:projectId/tasks/:taskId', (req, res) => {
    const { projectId, taskId } = req.params
    const { title, description, priority, dueDate, status } = req.body

    let tasks = []
    if (fs.existsSync(tasksFilePath)) {
        const data = fs.readFileSync(tasksFilePath)
        tasks = JSON.parse(data)
    }

    const task = tasks.find(t => t.pjId == projectId && t.id == taskId)
    if (!task) {
        return res.status(404).json({ message: 'Task not found.' })
    }

    if (title !== undefined) task.title = title
    if (description !== undefined) task.description = description
    if (priority !== undefined) task.priority = priority
    if (dueDate !== undefined) task.dueDate = dueDate
    if (status !== undefined) task.status = status

    fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2))

    return res.status(200).json(task)
})

// DELETE /projects/:projectId/tasks/:taskId: 특정 태스크 삭제
app.delete('/projects/:projectId/tasks/:taskId', (req, res) => {
    const { projectId, taskId } = req.params

    let tasks = []
    if (fs.existsSync(tasksFilePath)) {
        const data = fs.readFileSync(tasksFilePath)
        tasks = JSON.parse(data)
    }

    const taskIndex = tasks.findIndex(t => t.pjId == projectId && t.id == taskId)
    if (taskIndex === -1) {
        return res.status(404).json({ message: 'Task not found.' })
    }

    tasks.splice(taskIndex, 1)
    fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2))

    return res.status(200).json({ message: 'Task successfully deleted.' })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
