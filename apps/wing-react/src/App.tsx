import './App.css'
import { WingCode } from './components/WingCode'

function App() {

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <WingCode code={`
bring cloud;

inflight class Aaa {
  
}

new cloud.Function(inflight (event: Json?) => {
  let x:num = 1;
  let z = new Aaa();
});
        `} />
      </div>
    </>
  )
}

export default App
