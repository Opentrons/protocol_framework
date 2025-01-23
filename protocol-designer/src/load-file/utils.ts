import { saveAs } from 'file-saver'
import type { ProtocolFile } from '@opentrons/shared-data'
export const saveFile = (fileData: ProtocolFile, fileName: string, pythonFile?: string): void => {

  if (pythonFile) {
    const pyBlob = new Blob([pythonFile, `\n`], { type: 'text/x-python;charset=UTF-8' });
    var fileURL = URL.createObjectURL(pyBlob);
    window.open(fileURL, '_blank');
    return;
  }

  const blob = new Blob([JSON.stringify(fileData, null, 2)], {
    type: 'application/json',
  })
  saveAs(blob, fileName)
}
