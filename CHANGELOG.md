### 0.7.1
- save data in popup on `enter` key press

### 0.7.0
- set `fill` attribute in complex plan to group element around sector shapes. 
- allow to select only one sector
- discard selection on SVG coping to buffer

### 0.6.4
- refactored id attribute magic strings process.

### 0.6.3
- add shape wrapping with `<g></g>` for complex plans when 'add_sector' string is present in shape id
- add fill styles flatten from `<style></style>` to elements attributes 

### 0.6.2
- fixes attribute for complex plan parent

### 0.6.1
- always get sector name from `id` attribute even if `tc-sector-name` attribute exists

### 0.6.0
- zoom buttons in the popup to scale SVG
- select seat number field content on popup open
- complex sector plan editing

### 0.5.6
- do not drop saved sector name when already processed file was loaded

### 0.5.5
- set row numbers on the left of the first seat if seat number order is left to right

### 0.5.4
- remove classes from stand up sector drawn with 'rect'

### 0.5.3
- normalize font-size on map load

### 0.5.2
- styles classes modification iteration parameter increased to 100

### 0.5.1
- replace attributes underscore bug fix
- trim sector names

### 0.5.0
- "wrap_rows" attribute wraps all rows to sector group. Use when there's only one sector on plan

### 0.4.1
- keep id="sector_shape" on sector shape

### 0.4.0
- refactored automated group wrapping using "add_sector" and "add_row" attributes in complex cases of Corel Draw

### 0.3.2
- remove Id attribute tags on save, fill stand up sectors with `lightgrey` colour

### 0.3.1
- added polygon support as stand up sector shape

### 0.3.0
- style classes are removed only on SVG export to buffer
- sort nodes according to set seat numbers on SVG export
- removed `rtl` `ltr` export params

### 0.2.0
- `addsector` param renamed to `add_sector`

### 0.1.1
- Stand up sector definition fix

### 0.1.0
- Keep set row and seat numbers. Before they were rewritten by automate number set
- Close extension popup in Save button click

### 0.0.8
- Transform `<path />` to `<circle />` shape inside row groups only
- Group on sector level with `<path id="sector_shape" />` is correct structure now

### 0.0.7
- Fixed wrapping rows with sector group when a row with `id="addsector"` exists