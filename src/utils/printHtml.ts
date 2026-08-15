export function printHtml(html: string, title = 'Print Invoice') {
  const printWindow = window.open('', '_blank', 'width=1024,height=768');
  if (!printWindow) {
    alert('Please allow popups to print the invoice.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
}