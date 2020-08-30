<h4>File size impact</h4>

<table>
  <thead>
    <tr>
      <th nowrap>File</th>
      <th nowrap>raw</th>
      <th nowrap>gzip</th>
      <th nowrap>brotli</th>
      <th nowrap>reason</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td nowrap">dist/systemjs/bar.js</td>
      <td nowrap>-100</td>
      <td nowrap>-10</td>
      <td nowrap>-9</td>
      <td nowrap>deleted</td>
    </tr>
    <tr>
      <td nowrap>dist/systemjs/foo.js</td>
      <td nowrap>+120</td>
      <td nowrap>+12</td>
      <td nowrap>+11</td>
      <td nowrap>modified</td>
    </tr>
    <tr>
      <td nowrap>dist/systemjs/hello.js</td>
      <td nowrap>+20,000</td>
      <td nowrap>+200</td>
      <td nowrap>+200</td>
      <td nowrap>added</td>
    </tr>
  </tbody>
</table>
<br/>

<details>
  <summary>Overall size impact (+20,020 bytes)</summary>

  <table>
    <thead>
      <tr>
        <th nowrap>Group</th>
        <th nowrap>Files</th>
        <th nowrap>raw</th>
        <th nowrap>gzip</th>
        <th nowrap>brotli</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>systemjs</td>
        <td nowrap>3</td>
        <td nowrap>+20,020</td>
        <td nowrap>+202</td>
        <td nowrap>+202</td>
      </tr>
      <tr>
        <td nowrap>commonjs</td>
        <td nowrap>0</td>
        <td nowrap>-</td>
        <td nowrap>-</td>
        <td nowrap>-</td>
      </tr>
      <tr>
        <td nowrap>Total</td>
        <td nowrap>3</td>
        <td nowrap>+20,020</td>
        <td nowrap>+202</td>
        <td nowrap>+202</td>
      </tr>
    </tbody>
  </table>
  <br/>
</details>

<details>
  <summary>Cache impact (130,000 bytes)</summary>

  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>reason</th>
        <th nowrap>raw</th>
        <th nowrap>gzip</th>
        <th nowrap>brotli</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap">dist/systemjs/bar.js</td>
        <td nowrap>modified</td>
        <td nowrap>10,000</td>
        <td nowrap>1,000</td>
        <td nowrap>9,000</td>
      </tr>
      <tr>
        <td nowrap>dist/systemjs/foo.js</td>
        <td nowrap>added</td>
        <td nowrap>120,000</td>
        <td nowrap>12,000</td>
        <td nowrap>11,000</td>
      </tr>
    </tbody>
  </table>
  <br />
  <table>
    <thead>
      <tr>
        <th nowrap>Group</th>
        <th nowrap>Files</th>
        <th nowrap>raw</th>
        <th nowrap>gzip</th>
        <th nowrap>brotli</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>systemjs</td>
        <td nowrap>2</td>
        <td nowrap>130,000</td>
        <td nowrap>13,000</td>
        <td nowrap>12,000</td>
      </tr>
      <tr>
        <td nowrap>commonjs</td>
        <td nowrap>0</td>
        <td nowrap>-</td>
        <td nowrap>-</td>
        <td nowrap>-</td>
      </tr>
      <tr>
        <td nowrap>Total</td>
        <td nowrap>2</td>
        <td nowrap>130,000</td>
        <td nowrap>13,000</td>
        <td nowrap>12,000</td>
      </tr>
    </tbody>
  </table>
  <br />
</details>

<details>
  <summary>Detailed size impact (3)</summary>

  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>Transform</th>
        <th nowrap>Diff</th>
        <th nowrap>base</th>
        <th nowrap>after merge</th>
        <th nowrap>Event</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap rowspan="3">dist/systemjs/bar.js</td>
        <td nowrap>none</td>
        <td nowrap>-100</td>
        <td nowrap>100</td>
        <td nowrap>---</td>
        <td nowrap rowspan="3">deleted</td>
      </tr>
      <tr>
        <td nowrap>gzip</td>
        <td nowrap>-10</td>
        <td nowrap>10</td>
        <td nowrap>---</td>
      </tr>
      <tr>
        <td nowrap>brotli</td>
        <td nowrap>-9</td>
        <td nowrap>9</td>
        <td nowrap>---</td>
      </tr>
      <tr>
        <td nowrap rowspan="3">dist/systemjs/foo.js</td>
        <td nowrap>none</td>
        <td nowrap>+120</td>
        <td nowrap>---</td>
        <td nowrap>120</td>
        <td nowrap rowspan="3">created</td>
      </tr>
      <tr>
        <td nowrap>gzip</td>
        <td nowrap>+12</td>
        <td nowrap>---</td>
        <td nowrap>12</td>
      </tr>
      <tr>
        <td nowrap>brotli</td>
        <td nowrap>+11</td>
        <td nowrap>---</td>
        <td nowrap>11</td>
      </tr>
      <tr>
        <td nowrap rowspan="3">dist/systemjs/hello.js</td>
        <td nowrap>none</td>
        <td nowrap>+20,000</td>
        <td nowrap>167,000</td>
        <td nowrap>187,000</td>
        <td nowrap rowspan="3">changed</td>
      </tr>
      <tr>
        <td nowrap>gzip</td>
        <td nowrap>+200</td>
        <td nowrap>1,600</td>
        <td nowrap>1,800</td>
      </tr>
      <tr>
        <td nowrap>brotli</td>
        <td nowrap>+200</td>
        <td nowrap>1,500</td>
        <td nowrap>1,700</td>
      </tr>
    </tbody>
  </table>
  <br />
</details>
