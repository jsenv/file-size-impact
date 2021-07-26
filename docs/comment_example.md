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
        <td nowrap>dist/bar.js</td>
        <td nowrap>110B (+10B / +10%)</td>
        <td>:arrow_double_up:</td>
      </tr>
      <tr>
        <td nowrap>dist/foo.js</td>
        <td nowrap>115B (+15B / +15%)</td>
        <td>:arrow_double_up:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>225B (+25B / +12.5%)</td>
        <td>:arrow_double_up:</td>
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
        <td nowrap>dist/bar.js</td>
        <td nowrap>110B (+10B / +10%)</td>
        <td nowrap>22B (+2B / +10%)</td>
        <td nowrap>19B (+1B / +5.56%)</td>
        <td>:arrow_double_up:</td>
      </tr>
      <tr>
        <td nowrap>dist/foo.js</td>
        <td nowrap>115B (+15B / +15%)</td>
        <td nowrap>24B (+4B / +20%)</td>
        <td nowrap>21B (+3B / +16.67%)</td>
        <td>:arrow_double_up:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>225B (+25B / +12.5%)</td>
        <td nowrap>46B (+6B / +15%)</td>
        <td nowrap>40B (+4B / +11.11%)</td>
        <td>:arrow_double_up:</td>
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
        <td nowrap>15B (+5B / +50%)</td>
        <td>:arrow_double_up:</td>
      </tr>
      <tr>
        <td nowrap>dist/file-b.js</td>
        <td nowrap>10B (-5B / -33.33%)</td>
        <td>:arrow_double_down:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>25B (0B / +0%)</td>
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
        <td nowrap>83.45KB (+6.84KB / +8.92%)</td>
        <td nowrap>35.71KB (+3.91KB / +12.28%)</td>
        <td>:arrow_double_up:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>127.83KB (+6.84KB / +5.65%)</td>
        <td nowrap>58.69KB (+3.91KB / +7.13%)</td>
        <td>:arrow_double_up:</td>
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
        <td nowrap>21.05KB (+4.01KB / +23.55%)</td>
        <td nowrap>12.18KB (+2.87KB / +30.84%)</td>
        <td>:arrow_double_up:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>89.22KB (+4.01KB / +4.71%)</td>
        <td nowrap>49.41KB (+2.87KB / +6.17%)</td>
        <td>:arrow_double_up:</td>
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
        <td nowrap><del>dist/commonjs/bar.js</del></td>
        <td nowrap>0B (-100B)</td>
        <td nowrap>0B (-10B)</td>
        <td nowrap>0B (-9B)</td>
        <td></td>
      </tr>
      <tr>
        <td nowrap>dist/commonjs/foo.js</td>
        <td nowrap>120B</td>
        <td nowrap>12B</td>
        <td nowrap>11B</td>
        <td>:new:</td>
      </tr>
      <tr>
        <td nowrap>dist/commonjs/hello.js</td>
        <td nowrap>182.62KB (+19.53KB / +11.98%)</td>
        <td nowrap>1.76KB (+200B / +12.5%)</td>
        <td nowrap>1.66KB (+200B / +13.33%)</td>
        <td>:arrow_double_up:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>182.73KB (+19.55KB / +11.98%)</td>
        <td nowrap>1.77KB (+202B / +12.55%)</td>
        <td nowrap>1.67KB (+202B / +13.39%)</td>
        <td>:arrow_double_up:</td>
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
        <td nowrap><del>dist/systemjs/bar.js</del></td>
        <td nowrap>0B (-100B)</td>
        <td nowrap>0B (-10B)</td>
        <td nowrap>0B (-9B)</td>
        <td></td>
      </tr>
      <tr>
        <td nowrap>dist/systemjs/foo.js</td>
        <td nowrap>120B</td>
        <td nowrap>12B</td>
        <td nowrap>11B</td>
        <td>:new:</td>
      </tr>
      <tr>
        <td nowrap>dist/systemjs/hello.js</td>
        <td nowrap>182.62KB (+19.53KB / +11.98%)</td>
        <td nowrap>1.76KB (+200B / +12.5%)</td>
        <td nowrap>1.66KB (+200B / +13.33%)</td>
        <td>:arrow_double_up:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>182.73KB (+19.55KB / +11.98%)</td>
        <td nowrap>1.77KB (+202B / +12.55%)</td>
        <td nowrap>1.67KB (+202B / +13.39%)</td>
        <td>:arrow_double_up:</td>
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
        <td nowrap>315B (+15B / +5%)</td>
        <td>:arrow_up_small:</td>
      </tr>
      <tr>
        <td nowrap>dist/foo.js</td>
        <td nowrap>2.44KB (0B / +0%)</td>
        <td>:ghost:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>2.75KB (+15B / +0.54%)</td>
        <td>:arrow_up_small:</td>
      </tr>
    </tfoot>
  </table>
</details>

# zero size impact and cacheImpact enabled

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
        <td nowrap>315B (+15B / +5%)</td>
        <td>:arrow_up_small:</td>
      </tr>
      <tr>
        <td nowrap>dist/foo.js</td>
        <td nowrap>2.44KB (0B / +0%)</td>
        <td>:ghost:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>2.75KB (+15B / +0.54%)</td>
        <td>:arrow_up_small:</td>
      </tr>
      <tr>
        <td nowrap><strong>Cache impact</strong></td>
        <td nowrap>2.75KB</td>
        <td>:arrow_up:</td>
      </tr>
    </tfoot>
  </table>
</details>

# cache impact + several cache impact

<h4 id="file-size-impact">File size impact</h4>

<p>Merging <em>head</em> into <em>base</em> will impact 3 files in 1 group.</p>
<details>
  <summary>dist (3/3)</summary>
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
        <td nowrap>110B (+10B / +10%)</td>
        <td>:arrow_double_up:</td>
      </tr>
      <tr>
        <td nowrap>dist/foo.js</td>
        <td nowrap>100B</td>
        <td>:new:</td>
      </tr>
      <tr>
        <td nowrap>dist/hello.js</td>
        <td nowrap>110B (+10B / +10%)</td>
        <td>:arrow_double_up:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>320B (+120B / +60%)</td>
        <td>:arrow_double_up:</td>
      </tr>
      <tr>
        <td nowrap><strong>Cache impact</strong></td>
        <td nowrap>320B</td>
        <td>:arrow_up:</td>
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
        <td nowrap>101B (+1B / +1%)</td>
        <td>:arrow_up_small:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>101B (+1B / +1%)</td>
        <td>:arrow_up_small:</td>
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
        <td nowrap>115B (+14B / +13.86%)</td>
        <td>:arrow_double_up:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>216B (+15B / +7.46%)</td>
        <td>:arrow_double_up:</td>
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
        <td nowrap>101B (+1B / +1%)</td>
        <td>:arrow_up_small:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>216B (+15B / +7.46%)</td>
        <td>:arrow_double_up:</td>
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
        <td nowrap>115B (+14B / +13.86%)</td>
        <td>:arrow_double_up:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>115B (+14B / +13.86%)</td>
        <td>:arrow_double_up:</td>
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
        <td nowrap>110B</td>
        <td>:new:</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>110B (+110B / +100%)</td>
        <td>:arrow_double_up:</td>
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
        <td nowrap>0B (-110B)</td>
        <td></td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td nowrap><strong>Whole group</strong></td>
        <td nowrap>0B (-110B / -100%)</td>
        <td>:arrow_double_down:</td>
      </tr>
    </tfoot>
  </table>
</details>
