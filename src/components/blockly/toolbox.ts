export const TOOLBOX_XML = `
<xml>
  <category name="Điều khiển" colour="#4C97FF">
    <block type="event_start"></block>
    <block type="control_forever"></block>
    <block type="control_stop"></block>
    <sep gap="32"></sep>
    <block type="motion_move_forward">
      <value name="STEPS">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
    </block>
    <block type="motion_move_backward">
      <value name="STEPS">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
    </block>
    <block type="motion_move_forward_time"></block>
    <block type="motion_move_backward_time"></block>
    <block type="motion_turn_left">
      <value name="DEGREES">
        <shadow type="math_number">
          <field name="NUM">90</field>
        </shadow>
      </value>
    </block>
    <block type="motion_turn_right">
      <value name="DEGREES">
        <shadow type="math_number">
          <field name="NUM">90</field>
        </shadow>
      </value>
    </block>
  </category>
  <category name="Thoại" colour="#9966FF">
    <block type="looks_say"></block>
  </category>
  <category name="Âm thanh" colour="#CF63CF">
    <block type="sound_beep"></block>
    <block type="sound_tone"></block>
  </category>
  <sep></sep>
  <category name="Logic" colour="#5C81A6">
    <block type="controls_if"></block>
    <block type="logic_compare"></block>
    <block type="logic_operation"></block>
    <block type="logic_negate"></block>
    <block type="logic_boolean"></block>
    <block type="logic_null"></block>
    <block type="logic_ternary"></block>
  </category>

  <category name="Vòng lặp" colour="#5CA65C">
    <block type="controls_repeat_ext">
      <value name="TIMES">
        <shadow type="math_number">
          <field name="NUM">10</field>
        </shadow>
      </value>
    </block>
    <block type="controls_whileUntil"></block>
    <block type="controls_for">
      <value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
      <value name="TO"><shadow type="math_number"><field name="NUM">3</field></shadow></value>
      <value name="BY"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
    </block>
    <block type="controls_forEach"></block>
    <block type="controls_flow_statements"></block>
    
    <!-- Pre-assembled: Loop with Break -->
    <block type="controls_repeat_ext">
      <value name="TIMES">
        <shadow type="math_number">
          <field name="NUM">10</field>
        </shadow>
      </value>
      <statement name="DO">
        <block type="controls_flow_statements">
          <field name="FLOW">BREAK</field>
        </block>
      </statement>
    </block>
  </category>

  <category name="Toán học" colour="#5C68A6">
    <block type="math_number">
      <field name="NUM">123</field>
    </block>
    <block type="math_arithmetic">
      <value name="A">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
      <value name="B">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
    </block>
    <block type="math_single">
      <value name="NUM">
        <shadow type="math_number">
          <field name="NUM">9</field>
        </shadow>
      </value>
    </block>
    <block type="math_trig">
      <value name="NUM">
        <shadow type="math_number">
          <field name="NUM">45</field>
        </shadow>
      </value>
    </block>
    <block type="math_constant"></block>
    <block type="math_number_property">
      <value name="NUMBER_TO_CHECK">
        <shadow type="math_number">
          <field name="NUM">0</field>
        </shadow>
      </value>
    </block>
    <block type="math_round">
      <value name="NUM">
        <shadow type="math_number">
          <field name="NUM">3.1</field>
        </shadow>
      </value>
    </block>
    <block type="math_on_list"></block>
    <block type="math_modulo">
      <value name="DIVIDEND">
        <shadow type="math_number">
          <field name="NUM">64</field>
        </shadow>
      </value>
      <value name="DIVISOR">
        <shadow type="math_number">
          <field name="NUM">10</field>
        </shadow>
      </value>
    </block>
    <block type="math_constrain">
      <value name="VALUE">
        <shadow type="math_number">
          <field name="NUM">50</field>
        </shadow>
      </value>
      <value name="LOW">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
      <value name="HIGH">
        <shadow type="math_number">
          <field name="NUM">100</field>
        </shadow>
      </value>
    </block>
    <block type="math_random_int">
      <value name="FROM">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
      <value name="TO">
        <shadow type="math_number">
          <field name="NUM">100</field>
        </shadow>
      </value>
    </block>
    <block type="math_random_float"></block>
  </category>

  <category name="Văn bản" colour="#5CA68D">
    <block type="text"></block>
    <block type="text_join"></block>
    <block type="text_append">
      <value name="TEXT">
        <shadow type="text"></shadow>
      </value>
    </block>
    <block type="text_length">
      <value name="VALUE">
        <shadow type="text">
          <field name="TEXT">abc</field>
        </shadow>
      </value>
    </block>
    <block type="text_isEmpty">
      <value name="VALUE">
        <shadow type="text">
          <field name="TEXT"></field>
        </shadow>
      </value>
    </block>
    <block type="text_indexOf">
      <value name="VALUE">
        <block type="variables_get">
          <field name="VAR">text</field>
        </block>
      </value>
      <value name="FIND">
        <shadow type="text">
          <field name="TEXT">abc</field>
        </shadow>
      </value>
    </block>
    <block type="text_charAt">
      <value name="VALUE">
        <block type="variables_get">
          <field name="VAR">text</field>
        </block>
      </value>
    </block>
    <block type="text_getSubstring">
      <value name="STRING">
        <block type="variables_get">
          <field name="VAR">text</field>
        </block>
      </value>
    </block>
    <block type="text_changeCase">
      <value name="TEXT">
        <shadow type="text">
          <field name="TEXT">abc</field>
        </shadow>
      </value>
    </block>
    <block type="text_trim">
      <value name="TEXT">
        <shadow type="text">
          <field name="TEXT">abc</field>
        </shadow>
      </value>
    </block>
    <block type="text_print">
      <value name="TEXT">
        <shadow type="text">
          <field name="TEXT">abc</field>
        </shadow>
      </value>
    </block>
    <block type="text_prompt_ext">
      <value name="TEXT">
        <shadow type="text">
          <field name="TEXT">abc</field>
        </shadow>
      </value>
    </block>
  </category>

  <category name="Danh sách" colour="#745CA6">
    <block type="lists_create_with">
      <mutation items="0"></mutation>
    </block>
    <block type="lists_create_with"></block>
    <block type="lists_repeat">
      <value name="NUM">
        <shadow type="math_number">
          <field name="NUM">5</field>
        </shadow>
      </value>
    </block>
    <block type="lists_length"></block>
    <block type="lists_isEmpty"></block>
    <block type="lists_indexOf">
      <value name="VALUE">
        <block type="variables_get">
          <field name="VAR">list</field>
        </block>
      </value>
    </block>
    <block type="lists_getIndex">
      <value name="VALUE">
        <block type="variables_get">
          <field name="VAR">list</field>
        </block>
      </value>
    </block>
    <block type="lists_setIndex">
      <value name="LIST">
        <block type="variables_get">
          <field name="VAR">list</field>
        </block>
      </value>
    </block>
    <block type="lists_getSublist">
      <value name="LIST">
        <block type="variables_get">
          <field name="VAR">list</field>
        </block>
      </value>
    </block>
    <block type="lists_split">
      <value name="DELIM">
        <shadow type="text">
          <field name="TEXT">,</field>
        </shadow>
      </value>
    </block>
    <block type="lists_sort"></block>
    <block type="lists_reverse"></block>
  </category>

  <category name="Biến" colour="#A65C81" custom="VARIABLE"></category>
  <category name="Hàm" colour="#9A5CA6" custom="PROCEDURE"></category>
</xml>
`;
