(() => {
  const API_BASE = window.WINA_API_BASE || 'http://127.0.0.1:5000/api';
  const TAX_RATE = 0.10; // Project assumption; backend remains authoritative.
  const money = value => `K${Number(value || 0).toLocaleString('en-ZM', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
  const $ = id => document.getElementById(id);

  document.addEventListener('DOMContentLoaded', () => {
    const form = $('transactionForm');
    if (!form) return;
    const booth = $('booth'), service = $('service'), location = $('location');
    const rate = $('revenue'), amount = $('amount'), message = $('formMessage');
    const submit = form.querySelector('button[type="submit"]');
    let boothRecords = [];
    let serviceRecords = [];

    function showMessage(kind, text) {
      message.className = `alert alert-${kind}`;
      message.textContent = text;
      message.scrollIntoView({behavior:'smooth', block:'nearest'});
    }
    function clearMessage() { message.className = ''; message.textContent = ''; }
    function setOptions(select, placeholder, records, labelFn, valueFn) {
      select.replaceChildren(new Option(placeholder, ''));
      records.forEach(item => select.add(new Option(labelFn(item), String(valueFn(item)))));
    }
    function updateCalculation() {
      const gross = Number.parseFloat(amount.value);
      const valid = Number.isFinite(gross) && gross > 0;
      $('calcGross').textContent = money(valid ? gross : 0);
      $('calcTax').textContent = money(valid ? gross * TAX_RATE : 0);
      $('amountAfterTax').textContent = money(valid ? gross * (1 - TAX_RATE) : 0);
    }
    function resetService() {
      service.replaceChildren(new Option(booth.value ? 'Loading services…' : 'Choose a booth first', ''));
      service.disabled = true;
      rate.value = '';
    }

    async function loadBooths() {
      try {
        const response = await fetch(`${API_BASE}/booths`);
        if (!response.ok) throw new Error('Could not load booths');
        boothRecords = await response.json();
        setOptions(booth, 'Choose a booth', boothRecords, b => `${b.name} · ${b.location}`, b => b.id);
      } catch (error) {
        // A friendly fallback keeps the form usable for local frontend demos.
        boothRecords = [
          {id:1,name:'Wina1',location:'Lusaka CBD'},{id:2,name:'Wina2',location:'Libala'},
          {id:3,name:'Wina3',location:'Kabwata'},{id:4,name:'Wina4',location:'Mandevu'},
          {id:5,name:'Wina5',location:'Woodlands'},{id:6,name:'Wina6',location:'Matero East'}
        ];
        setOptions(booth, 'Choose a booth', boothRecords, b => `${b.name} · ${b.location}`, b => b.id);
        showMessage('info', 'The booth list is using local demo options because the backend could not be reached. Start the Flask server to save transactions.');
      }
    }

    booth.addEventListener('change', async () => {
      clearMessage();
      const selected = boothRecords.find(item => String(item.id) === booth.value);
      location.value = selected?.location || '';
      resetService();
      if (!selected) return;
      try {
        const response = await fetch(`${API_BASE}/booths/${selected.id}/services`);
        if (!response.ok) throw new Error('Could not load services');
        serviceRecords = await response.json();
        setOptions(service, 'Choose a service', serviceRecords, item => item.name, item => item.id);
        service.disabled = false;
      } catch (error) {
        const fallback = {
          1:[['Airtel Money',.05],['MTN Money',.06],['Zamtel Money',.045],['Zanaco',.035],['FNB',.04]],
          2:[['Airtel Money',.05],['MTN Money',.06],['Zamtel Money',.045],['FNB',.04]],
          3:[['Airtel Money',.05],['MTN Money',.06],['Zamtel Money',.045],['Zanaco',.035],['FNB',.04]],
          4:[['Airtel Money',.05],['MTN Money',.06],['Zamtel Money',.045]],
          5:[['Airtel Money',.05],['MTN Money',.06],['Zanaco',.035],['FNB',.04]],
          6:[['Airtel Money',.05],['MTN Money',.06],['Zamtel Money',.045]]
        };
        serviceRecords = (fallback[selected.id] || []).map((item, i) => ({id:{'Airtel Money':1,'MTN Money':2,'Zamtel Money':3,'Zanaco':4,'FNB':5}[item[0]],name:item[0],revenue_per_kwacha:item[1]}));
        setOptions(service, 'Choose a service', serviceRecords, item => item.name, item => item.id);
        service.disabled = false;
        showMessage('info', 'Service options are in demo mode. The backend must be running to verify and save the transaction.');
      }
    });

    service.addEventListener('change', () => {
      const selected = serviceRecords.find(item => String(item.id) === service.value);
      rate.value = selected && Number.isFinite(Number(selected.revenue_per_kwacha)) ? `${(Number(selected.revenue_per_kwacha) * 100).toFixed(2)}%` : '';
      clearMessage();
    });
    amount.addEventListener('input', updateCalculation);

    form.addEventListener('submit', async event => {
      event.preventDefault();
      clearMessage();
      if (!booth.value || !service.value || !Number.isFinite(Number(amount.value)) || Number(amount.value) <= 0) {
        showMessage('danger', 'Choose a booth and service, then enter a transaction amount greater than zero.');
        form.reportValidity();
        return;
      }
      submit.disabled = true;
        submit.setAttribute('aria-busy', 'true');
        submit.querySelector('.button-label').textContent = 'Saving…';
      try {
        const response = await fetch(`${API_BASE}/transactions`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({booth_id:Number(booth.value),service_id:Number(service.value),amount:Number(amount.value)})
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'The transaction could not be saved. Please review the details.');
        const reference = data.id || data.transaction_id;
        $('transactionId').value = reference || '';
        showMessage('success', `Transaction recorded successfully${reference ? ` · Reference ${reference}` : ''}.`);
        form.reset();
        location.value = ''; rate.value = ''; resetService(); updateCalculation();
        $('transactionId').value = reference || '';
      } catch (error) {
        showMessage('danger', error.message === 'Failed to fetch' ? 'Could not reach the server. Start the Flask backend and try again. No transaction was saved.' : error.message);
      } finally {
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
        submit.querySelector('.button-label').textContent = 'Record transaction';
      }
    });

    resetService(); updateCalculation(); loadBooths();
  });
})();
