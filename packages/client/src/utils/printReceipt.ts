// packages/client/src/utils/printReceipt.ts

interface ReceiptData {
  txId?: string;
  date?: string | Date;
  hotelName?: string;
  departmentName?: string;
  itemName?: string;
  actionText: string;
  quantity: number | string;
  createdBy?: string;
  signatureName?: string;
  designation?: string; 
  remarks?: string;
}

export const printReceipt = (data: ReceiptData) => {
  const printWindow = window.open('', '_blank', 'width=800,height=800');
  if (!printWindow) {
    alert("Pop-up blocker prevented printing. Please allow pop-ups.");
    return;
  }

  const txId = data.txId ? data.txId.slice(-8).toUpperCase() : `REF-${Math.floor(Math.random() * 1000000)}`;
  const dateText = data.date ? new Date(data.date).toLocaleString() : new Date().toLocaleString();
  
  const roleText = data.designation ? data.designation.replace('_', ' ') : '';
  const sigName = data.signatureName !== undefined ? data.signatureName : (data.createdBy || 'System User');


  // THE MAGIC: Only generate the Location HTML if the action is a Transfer!
  const isTransfer = data.actionText.includes('TRANSFER');
  const locationHtml = isTransfer ? `
    <div class="row">
      <span class="label">Location (Hotel):</span>
      <span class="value">${data.hotelName || 'Main Property'}</span>
    </div>
  ` : '';

  const html = `
    <html>
      <head>
        <title>Receipt - ${txId}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #000; }
          
          .receipt-box { max-width: 450px; margin: 0 auto; border: 1px solid #ddd; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 15px; margin-bottom: 20px; }
          .header h2 { margin: 0 0 5px 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;}
          .header p { margin: 0; font-size: 14px; color: #666; }
          .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; }
          .label { color: #555; }
          .value { font-weight: bold; text-align: right; max-width: 65%; word-wrap: break-word; }
          .highlight { font-size: 18px; color: #000; }
          
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; border-top: 2px dashed #ccc; padding-top: 15px; }
          
          .signature-wrapper {
            margin-top: 100px; 
            text-align: left; 
            width: 100%;
            page-break-inside: avoid;
          }
          .sign-area {
            width: 150px; 
            text-align: center; 
          }
          .the-line {
            border-bottom: 2px solid #000 !important; 
            width: 100%;
            margin-bottom: 8px;
          }
          .sign-name { font-weight: bold; font-size: 14px; margin-bottom: 3px;}
          .sign-role { font-size: 12px; color: #555; text-transform: uppercase; }
          
          @page { size: auto; margin: 0mm; }
          @media print {
            body { background: white; padding: 20mm; } 
            .receipt-box { border: none; box-shadow: none; padding: 0; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <h2>Inventory Receipt</h2>
            <p>${dateText}</p>
          </div>
          
          <div class="row">
            <span class="label">Reference ID:</span>
            <span class="value">#${txId}</span>
          </div>
          
          ${locationHtml}
          
          <div class="row">
            <span class="label">Department:</span>
            <span class="value">${data.departmentName || 'All'}</span>
          </div>
          <div class="row">
            <span class="label">Item Name:</span>
            <span class="value">${data.itemName || 'Unknown Item'}</span>
          </div>
          <div class="row" style="margin-top: 20px;">
            <span class="label">Action Logged:</span>
            <span class="value" style="text-transform: uppercase;">${data.actionText}</span>
          </div>
          <div class="row">
            <span class="label">Quantity:</span>
            <span class="value highlight">${data.quantity}</span>
          </div>
          <div class="row" style="margin-top: 20px;">
            <span class="label">Remarks/Notes:</span>
            <span class="value">${data.remarks || 'None'}</span>
          </div>

          <div class="footer">
            <strong>${data.hotelName || 'All'}</strong><br/>
            Official Audit Record
          </div>
        </div>

        <div class="signature-wrapper">
          <div class="sign-area">
            <div class="the-line"></div>
            <div class="sign-name">${sigName}</div>
            <div class="sign-role">${roleText}</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};