import { createElement } from "../reactless";

const TableRow = (key) => {
    return (
        <tr key={key}>
            <th>something</th>
            <th>something</th>
            <th>something</th>
        </tr>
    )
}

const App = () => {
    return (
        <div>
            <h1 title="harsh" className="main" key='abc'>harsho</h1>
            <h2>testing somethin</h2>
            {/* <table> */}
            {/*     {for (let i = 0; i<10; i++) { */}
            {/*         TableRow(i) */}
            {/*     }} */}
            {/* </table> */}
        </div>
    )
}

export default App;
