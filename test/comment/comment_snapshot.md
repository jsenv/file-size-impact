# basic example

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will impact 2 files in 1 group.</p>
<details>
  <summary>dist (2/2)</summary>
  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>new size</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>dist/foo.js</td>
        <td nowrap>115 B (+15 B / +15%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
      <tr>
        <td nowrap>dist/bar.js</td>
        <td nowrap>110 B (+10 B / +10%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>225 B (+25 B / +12.5%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tfoot>
  </table>
</details>

# basic example + gzip + brotli

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will impact 2 files in 1 group.</p>
<details>
  <summary>dist (2/2)</summary>
  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>new size</th>
        <th nowrap>new gzip size</th>
        <th nowrap>new brotli size</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>dist/foo.js</td>
        <td nowrap>115 B (+15 B / +15%)</td>
        <td nowrap>24 B (+4 B / +20%)</td>
        <td nowrap>21 B (+3 B / +16.67%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
      <tr>
        <td nowrap>dist/bar.js</td>
        <td nowrap>110 B (+10 B / +10%)</td>
        <td nowrap>22 B (+2 B / +10%)</td>
        <td nowrap>19 B (+1 B / +5.56%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>225 B (+25 B / +12.5%)</td>
        <td nowrap>46 B (+6 B / +15%)</td>
        <td nowrap>40 B (+4 B / +11.11%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tfoot>
  </table>
</details>

# no changes

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will not impact files in any group.</p>
<details>
  <summary>dist (0/1)</summary>
  <p>No impact on files in dist group.</p>
</details>

# no files

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will not impact files in any group.</p>
<details>
  <summary>dist (0/0)</summary>
  <p>No file in dist group (see config below).</p>

```json
{
  "*/**": false
}
```

</details>

# changes cancels each other

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will impact 2 files in 1 group.</p>
<details>
  <summary>dist (2/2)</summary>
  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>new size</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>dist/file-a.js</td>
        <td nowrap>15 B (+5 B / +50%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
      <tr>
        <td nowrap>dist/file-b.js</td>
        <td nowrap>10 B (-5 B / -33.33%)</td>
        <td>:arrow_lower_right:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>25 B (0 B / +0%)</td>
        <td>:ghost:</td>
      </tr>
    </tfoot>
  </table>
</details>

# realist (two groups + gzip + partial)

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will impact 2 files in 2 groups.</p>
<details>
  <summary>critical files (1/2)</summary>
  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>new size</th>
        <th nowrap>new gzip size</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>dist/foo.js</td>
        <td nowrap>85.5 kB (+7 kB / +8.92%)</td>
        <td nowrap>36.6 kB (+4 kB / +12.28%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>131 kB (+7 kB / +5.65%)</td>
        <td nowrap>60.1 kB (+4 kB / +7.13%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tfoot>
  </table>
</details>

<details>
  <summary>remaining files (1/5)</summary>
  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>new size</th>
        <th nowrap>new gzip size</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>dist/feature.js</td>
        <td nowrap>21.6 kB (+4.11 kB / +23.55%)</td>
        <td nowrap>12.5 kB (+2.94 kB / +30.84%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>91.4 kB (+4.11 kB / +4.71%)</td>
        <td nowrap>50.6 kB (+2.94 kB / +6.17%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tfoot>
  </table>
</details>

# two groups + gzip + brotli

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will impact 6 files in 2 groups.</p>
<details>
  <summary>dist/commonjs (3/3)</summary>
  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>new size</th>
        <th nowrap>new gzip size</th>
        <th nowrap>new brotli size</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>dist/commonjs/hello.js</td>
        <td nowrap>187 kB (+20 kB / +11.98%)</td>
        <td nowrap>1.8 kB (+200 B / +12.5%)</td>
        <td nowrap>1.7 kB (+200 B / +13.33%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
      <tr>
        <td nowrap>dist/commonjs/foo.js</td>
        <td nowrap>120 B</td>
        <td nowrap>12 B</td>
        <td nowrap>11 B</td>
        <td>:baby:</td>
      </tr>
      <tr>
        <td nowrap><del>dist/commonjs/bar.js</del></td>
        <td nowrap>0 B (-100 B)</td>
        <td nowrap>0 B (-10 B)</td>
        <td nowrap>0 B (-9 B)</td>
        <td></td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>187 kB (+20 kB / +11.98%)</td>
        <td nowrap>1.81 kB (+202 B / +12.55%)</td>
        <td nowrap>1.71 kB (+202 B / +13.39%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tfoot>
  </table>
</details>

<details>
  <summary>dist/systemjs (3/3)</summary>
  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>new size</th>
        <th nowrap>new gzip size</th>
        <th nowrap>new brotli size</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>dist/systemjs/hello.js</td>
        <td nowrap>187 kB (+20 kB / +11.98%)</td>
        <td nowrap>1.8 kB (+200 B / +12.5%)</td>
        <td nowrap>1.7 kB (+200 B / +13.33%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
      <tr>
        <td nowrap>dist/systemjs/foo.js</td>
        <td nowrap>120 B</td>
        <td nowrap>12 B</td>
        <td nowrap>11 B</td>
        <td>:baby:</td>
      </tr>
      <tr>
        <td nowrap><del>dist/systemjs/bar.js</del></td>
        <td nowrap>0 B (-100 B)</td>
        <td nowrap>0 B (-10 B)</td>
        <td nowrap>0 B (-9 B)</td>
        <td></td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>187 kB (+20 kB / +11.98%)</td>
        <td nowrap>1.81 kB (+202 B / +12.55%)</td>
        <td nowrap>1.71 kB (+202 B / +13.39%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tfoot>
  </table>
</details>

# zero size impact

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will impact 2 files in 1 group.</p>
<details>
  <summary>dist (2/2)</summary>
  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>new size</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>dist/bar.js</td>
        <td nowrap>315 B (+15 B / +5%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
      <tr>
        <td nowrap>dist/foo.js</td>
        <td nowrap>2.5 kB (0 B / +0%)</td>
        <td>:ghost:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>2.81 kB (+15 B / +0.54%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tfoot>
  </table>
</details>

# size impact 0/1

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will not impact files in any group.</p>
<details>
  <summary>dist (0/1)</summary>
  <details>
  <summary>Hidden (1)</summary>
  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>new size</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>dist/bar.js</td>
        <td nowrap>101 B (+1 B / +1%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>101 B (+1 B / +1%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tfoot>
  </table>
</details>
</details>

# size impact 1/2

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will impact 1 file in 1 group.</p>
<details>
  <summary>dist (1/2)</summary>
  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>new size</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>dist/foo.js</td>
        <td nowrap>115 B (+14 B / +13.86%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>216 B (+15 B / +7.46%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tfoot>
  </table>
<details>
  <summary>Hidden (1)</summary>
  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>new size</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>dist/bar.js</td>
        <td nowrap>101 B (+1 B / +1%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>216 B (+15 B / +7.46%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tfoot>
  </table>
</details>
</details>

# formating file relative url

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will impact 1 file in 1 group.</p>
<details>
  <summary>dist (1/1)</summary>
  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>new size</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>foo.js</td>
        <td nowrap>115 B (+14 B / +13.86%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>115 B (+14 B / +13.86%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tfoot>
  </table>
</details>

# empty warning

---

**Warning:** Nothing is tracked. It happens when tracking config is an empty object.

---

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will not impact files in any group.</p>

# new file + showSizeImpact

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will impact 1 file in 1 group.</p>
<details>
  <summary>dist (1/1)</summary>
  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>new size</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>dist/foo.js</td>
        <td nowrap>110 B</td>
        <td>:baby:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>110 B (+110 B / +100%)</td>
        <td>:arrow_upper_right:</td>
      </tr>
    </tfoot>
  </table>
</details>

# deleted file + showSizeImpact

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will impact 1 file in 1 group.</p>
<details>
  <summary>dist (1/1)</summary>
  <table>
    <thead>
      <tr>
        <th nowrap>File</th>
        <th nowrap>new size</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap><del>dist/foo.js</del></td>
        <td nowrap>0 B (-110 B)</td>
        <td></td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>0 B (-110 B / -100%)</td>
        <td>:arrow_lower_right:</td>
      </tr>
    </tfoot>
  </table>
</details>
