import { useState } from 'react'
import './App.css'
import { Button } from "@/components/ui/button"


function App() {
  const [count, setCount] = useState(0)
  const buttonHandler=()=>{
    setCount(count+1);
  }

  return (
    <>
      <div>
        <div className="flex min-h-svh flex-col items-center justify-center">
          <Button onClick={()=>{buttonHandler()}}>Click me {count}</Button>
        </div>
      </div>
    </>
  )
}

export default App
