'use client'  //will tell next js that this will run in BROWSER

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase/client"  //this is my own clinet in lib->supabase->client (single)

export default function Page(){
  //user state
  const [userId, setUserId] = useState<string | null>(null) //initilaly null
  //email state
  const [email, setEmail] = useState('')  
  // loaidng email status if maigc link worked
  const [loading, setLoading] = useState(false)
  // error state
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // task states
  const [tasks, setTasks] = useState<any[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [tasksError, setTasksError] = useState<string | null>(null)
  // create new task state
  const [newTitle, setNewTitle] = useState('')   



// ++++++++++++++++++++++ USE EFFECT ++++++++++++++++++

  // for restoring sesion and listen change oth state
  useEffect(() =>{
    // when mount ( component added in DOM) restire session
    supabase.auth.getUser().then(({data})=> {
      setUserId(data.user?.id ?? null)
    })

    const{data : sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id??null)  //if session or user is null return undefined
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  // run fetch taks when user signs in
  // if data exist load all task else set taks as  null
  useEffect(() => {
    if (userId) {
      fetchTasks()
    } else if (tasks.length > 0) {
      setTasks([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  //realtime update across all devuces so we dont have to refreah manually
  useEffect(() => {
    if (!userId) return

    // Subscribe to any change on the tasks table.
    // RLS ensures you only get events for rows you’re allowed to see.
    const channel = supabase
      .channel('tasks-realtime') // any unique name is fine
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          // whenever an insert/update/delete happens, refresh list
          fetchTasks()
        }
      )
      .subscribe()

    // cleanup: remove the channel (must return void)
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

// ++++++++++++++++++++++ functions ++++++++++++++++++
  async function sendMagicLink() {
    try{
      setLoading(true)
      setErrorMsg(null)
      const {error} = await supabase.auth.signInWithOtp({   //sends email of secure login link
        email,
        options:{
          emailRedirectTo:
          typeof window !== 'undefined' ? window.location.origin : undefined
        }
      })
      if (error) throw error  //if error occurs send to catch block
      alert('Magic link sent. Please check your email.')  //else sent success alert
      setEmail('') //reset email
    } 
    catch(err: any){
      setErrorMsg(err.message || 'Error sending link')
    } finally {
      setLoading(false)  //renebale button
    }  
  }

  async function signOut() {
    await supabase.auth.signOut() 
  }

  // fetch tasks from supabase
  async function fetchTasks() {
    setLoadingTasks(true)
    setTasksError(null)
    try{
      const{data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('owner', userId) // only get current user’s tasks
      .order('created_at', {ascending:false})

      if (error) throw error //if error throw err goto catch block
      setTasks(data || [])   //else set current data as task or null
    }
    catch (err: any){
      setTasksError(err.message || 'Error loading tasks')
    } finally {
      setLoadingTasks(false) //renable
    }
  }

  // Create / add task to supabase
  async function  addTask() {
    if (!newTitle.trim() || !userId) return //dont add if any of these is empty

    try{
      const {error} = await supabase.from('tasks').insert({
        title : newTitle.trim(),
        status: 'todo',
        owner: userId,  //rls (row level security)
      })

      if (error) throw error 
      setNewTitle('')
      fetchTasks() //to refresh the page
    }
    catch(err : any) {
      setTasksError(err.message || 'Error adding task')
    }
    
  }
  // Update status of the task
  async function updateTaskStatus(id:string, status: 'todo' | 'doing' | 'done') {
    try{
      const {error} = await supabase.from('tasks').update({status}).eq('id',id)
      if (error) throw error
      fetchTasks()  //refresh
    }
    catch (err: any){
      setTasksError ( err.message || 'Error updating the task status')
    }
  }

  //delete task
  async function deleteTask(id:string) {
    try{
      const {error} = await supabase.from('tasks').delete().eq('id',id)
      if (error) throw error
      fetchTasks()
    }
    catch (err: any){
      setTasksError( err.message || 'Error deleting task.')
    }
    
  }

  return(
    <main style={{ padding:20, fontFamily: 'sans-serif'}}>
      <h1>Auth Test</h1>
      {!userId ? (         
        <>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginRight : 10}}
          />
          <button onClick={sendMagicLink} disabled={loading || !email}>
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
          {errorMsg && <p style={{color : 'red'}}>{errorMsg}</p>}
        </>
      ) : (
        <>
            <p>Signed in as {userId}</p>
            <button onClick={signOut}> Sign Out </button>  

             {/*create/add task input*/}
              <div style ={{marginTop : 20}}>
                <input
                  type="text"
                  placeholder="New task title..."
                  value={newTitle}
                  onChange={(e) =>setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  style={{marginRight:10}}
                />
                <button onClick={addTask}> Add Task</button>
              </div>
             {/*view/load task input*/}
            <h2 style ={{ marginTop : 20}}> Your Tasks</h2> 
            {loadingTasks && <p> Loading Tasks...</p>}
            {tasksError && <p style={{color:'red'}}>{tasksError}</p>}  
            {!loadingTasks && !tasksError && (
              <ul>
                {tasks.length === 0 ? ( <li> No Tasks yet. </li>
                ) : (
                  tasks.map (task  => 
                    (<li key={task.id} style={{display : 'flex', gap:8, alignItems: 'center'}}>
                        <span style={{ flex: 1}}>{task.title}</span>
                        <span style={{ flex: 1}}>{task.status}</span>
                        <span style={{ flex: 1}}>{task.owner}</span>

                        <select 
                            value={task.status}
                            onChange={(e) =>
                              updateTaskStatus(task.id, e.target.value as 'todo' | 'doing' | 'done')
                            }>
                              <option value='todo'>todo</option>
                              <option value='doing'>doing</option>
                              <option value='done'>done</option>
                            </select>
                    
                            <button onClick={() => deleteTask(task.id)}>Delete</button>
                    </li>
                    ))
                  )
                }
              </ul>
            )} 
        </>
      )}
    </main>
  )
}