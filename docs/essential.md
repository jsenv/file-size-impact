<h4>File size impact</h4>

<h5>systemjs (3)</h5>
<table>
  <thead>
    <tr>
      <th nowrap>file</th>
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
    <tr>
      <td>Total</td>
      <td nowrap>+20,020</td>
      <td nowrap>+202</td>
      <td nowrap>+202</td>
      <td nowrap></td>
    </tr>
  </tbody>
</table>

<h5>commonjs (1)</h5>
<table>
<tbody>
<tr>
      <th nowrap>file</th>
      <th nowrap>raw</th>
      <th nowrap>gzip</th>
      <th nowrap>brotli</th>
      <th nowrap>reason</th>
    <tr>
      <td nowrap">dist/commonjs/bar.js</td>
      <td nowrap>-100</td>
      <td nowrap>-10</td>
      <td nowrap>-9</td>
      <td nowrap>deleted</td>
    </tr>
    <tr>
      <td>Total</td>
      <td nowrap>-100</td>
      <td nowrap>-10</td>
      <td nowrap>-9</td>
      <td nowrap></td>
    </tr>
  </tbody>
</table>
<br />

<details>
  <summary>cache impact (2)</summary>

  <h5>systemjs (1)</h5>

  <p>1 file modified or added in systemjs group for a total of 30,000 bytes to download for a returning user.</p>

  <table>
    <thead>
      <tr>
        <th nowrap>file</th>
        <th nowrap>raw</th>
        <th nowrap>gzip</th>
        <th nowrap>brotli</th>
        <th nowrap>reason</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap">dist/systemjs/bar.js</td>
        <td nowrap>10,000</td>
        <td nowrap>1,000</td>
        <td nowrap>9,000</td>
        <td nowrap>modified</td>
      </tr>
    </tbody>
  </table>

  <h5>commonjs (1)</h5>

  <p>1 file modified or added in commonjs group for a total of 30,000 bytes to download for a returning user.</p>

  <table>
    <thead>
      <tr>
        <th nowrap>file</th>
        <th nowrap>reason</th>
        <th nowrap>raw</th>
        <th nowrap>gzip</th>
        <th nowrap>brotli</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap">dist/commonjs/bar.js</td>
        <td nowrap>modified</td>
        <td nowrap>10,000</td>
        <td nowrap>1,000</td>
        <td nowrap>9,000</td>
      </tr>
    </tbody>
  </table>
</details>

<details>
  <summary>detailed size impact (3)</summary>

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
