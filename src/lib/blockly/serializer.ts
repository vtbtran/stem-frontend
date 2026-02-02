import * as Blockly from "blockly";

export function workspaceToXmlText(ws: Blockly.Workspace): string {
  const dom = Blockly.Xml.workspaceToDom(ws);
  return Blockly.Xml.domToText(dom);
}

export function xmlTextToWorkspace(ws: Blockly.Workspace, xmlText: string) {
  ws.clear();
  const dom = Blockly.utils.xml.textToDom(xmlText);
  Blockly.Xml.domToWorkspace(dom, ws);
}
