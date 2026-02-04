/* global React, ReactDOM */

(() => {
  const { useEffect, useMemo, useRef, useState } = React;
  const h = React.createElement;

  function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function useLocalStorageState(key, initialValue) {
    const [state, setState] = useState(() => {
      const raw = localStorage.getItem(key);
      if (raw == null) return typeof initialValue === "function" ? initialValue() : initialValue;
      return safeJsonParse(raw, initialValue);
    });

    useEffect(() => {
      localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState];
  }

  function formatDate(d) {
    try {
      return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
    } catch {
      return String(d);
    }
  }

  function seedEmployees() {
    const today = new Date();
    const daysAgo = (n) => new Date(today.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

    return [
      {
        id: uid(),
        name: "Aisha Khan",
        title: "Frontend Engineer",
        department: "Engineering",
        location: "Hyderabad",
        email: "aisha.khan@company.com",
        status: "Active",
        startDate: daysAgo(420),
        notes: "Owns design system components. Great at UX details.",
      },
      {
        id: uid(),
        name: "Rohit Verma",
        title: "QA Analyst",
        department: "Quality",
        location: "Bengaluru",
        email: "rohit.verma@company.com",
        status: "Active",
        startDate: daysAgo(190),
        notes: "Automation + exploratory testing. Strong release coordination.",
      },
      {
        id: uid(),
        name: "Meera Iyer",
        title: "HR Generalist",
        department: "People",
        location: "Remote",
        email: "meera.iyer@company.com",
        status: "Onboarding",
        startDate: daysAgo(12),
        notes: "Leading onboarding improvements and policy documentation.",
      },
      {
        id: uid(),
        name: "Daniel Park",
        title: "Data Analyst",
        department: "Analytics",
        location: "Pune",
        email: "daniel.park@company.com",
        status: "Active",
        startDate: daysAgo(310),
        notes: "Builds dashboards, maintains KPI definitions, supports stakeholders.",
      },
      {
        id: uid(),
        name: "Sana Rahman",
        title: "Product Designer",
        department: "Design",
        location: "Mumbai",
        email: "sana.rahman@company.com",
        status: "Inactive",
        startDate: daysAgo(680),
        notes: "Recently transitioned. Keep access reviewed.",
      },
    ];
  }

  function Icon({ name }) {
    const icons = {
      people: "👥",
      plus: "＋",
      search: "⌕",
      sort: "⇅",
      edit: "✎",
      trash: "🗑",
      check: "✓",
      reset: "↺",
    };
    return h("span", { "aria-hidden": true }, icons[name] || "•");
  }

  function Toasts({ toasts, onDismiss }) {
    if (!toasts.length) return null;
    return h(
      "div",
      { className: "toastWrap", role: "region", "aria-label": "Notifications" },
      toasts.map((t) =>
        h(
          "div",
          { key: t.id, className: "toast", role: "status" },
          h("div", { className: "t" }, t.title),
          h("div", { className: "d" }, t.description),
          h(
            "div",
            { style: { marginTop: 10, display: "flex", justifyContent: "flex-end" } },
            h(
              "button",
              { className: "btn small", onClick: () => onDismiss(t.id) },
              "Dismiss"
            )
          )
        )
      )
    );
  }

  function App() {
    const [employees, setEmployees] = useLocalStorageState("employees:v1", seedEmployees);
    const [selectedId, setSelectedId] = useLocalStorageState("employees:selectedId:v1", null);
    const [page, setPage] = useLocalStorageState("employees:page:v1", "directory");

    const [query, setQuery] = useState("");
    const [department, setDepartment] = useState("All");
    const [status, setStatus] = useState("All");
    const [sortBy, setSortBy] = useState("name");
    const [sortDir, setSortDir] = useState("asc");

    const [draft, setDraft] = useState(null); // { mode: 'create'|'edit', employeeId? }
    const [toasts, setToasts] = useState([]);

    const searchRef = useRef(null);

    const selected = useMemo(() => employees.find((e) => e.id === selectedId) || null, [employees, selectedId]);

    const departments = useMemo(() => {
      const set = new Set(employees.map((e) => e.department).filter(Boolean));
      return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
    }, [employees]);

    const statuses = ["All", "Active", "Onboarding", "Inactive"];

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      let list = employees.slice();
      if (department !== "All") list = list.filter((e) => e.department === department);
      if (status !== "All") list = list.filter((e) => e.status === status);
      if (q) {
        list = list.filter((e) => {
          const hay = `${e.name} ${e.title} ${e.department} ${e.location} ${e.email}`.toLowerCase();
          return hay.includes(q);
        });
      }
      list.sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        const av = (a[sortBy] || "").toString().toLowerCase();
        const bv = (b[sortBy] || "").toString().toLowerCase();
        return av.localeCompare(bv) * dir;
      });
      return list;
    }, [employees, query, department, status, sortBy, sortDir]);

    useEffect(() => {
      function onKeyDown(e) {
        const isMac = navigator.platform.toLowerCase().includes("mac");
        const mod = isMac ? e.metaKey : e.ctrlKey;
        if (mod && e.key.toLowerCase() === "k") {
          e.preventDefault();
          if (searchRef.current) searchRef.current.focus();
        }
        if (e.key === "Escape") {
          if (draft) setDraft(null);
        }
      }
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [draft]);

    useEffect(() => {
      // Keep selection valid if list changed
      if (selectedId && !employees.some((e) => e.id === selectedId)) {
        setSelectedId(null);
      }
    }, [employees, selectedId, setSelectedId]);

    function toast(title, description) {
      const id = uid();
      setToasts((t) => [...t, { id, title, description }]);
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 4200);
    }

    function onCreate() {
      setDraft({ mode: "create" });
      setPage("directory");
    }

    function onEdit(employeeId) {
      setDraft({ mode: "edit", employeeId });
      setPage("directory");
    }

    function onDelete(employeeId) {
      const emp = employees.find((e) => e.id === employeeId);
      const ok = window.confirm(`Delete ${emp ? emp.name : "this employee"}? This cannot be undone.`);
      if (!ok) return;
      setEmployees((list) => list.filter((e) => e.id !== employeeId));
      toast("Employee deleted", "The record was removed from your local data.");
    }

    function onSaveEmployee(nextEmployee) {
      setEmployees((list) => {
        const idx = list.findIndex((e) => e.id === nextEmployee.id);
        if (idx === -1) return [nextEmployee, ...list];
        const copy = list.slice();
        copy[idx] = nextEmployee;
        return copy;
      });
      setSelectedId(nextEmployee.id);
      setDraft(null);
      toast("Saved", "Employee details were updated.");
    }

    function onResetDemo() {
      const ok = window.confirm("Reset demo data? This will replace your current local data.");
      if (!ok) return;
      const seeded = seedEmployees();
      setEmployees(seeded);
      setSelectedId(seeded[0]?.id || null);
      setPage("directory");
      setDraft(null);
      setQuery("");
      setDepartment("All");
      setStatus("All");
      setSortBy("name");
      setSortDir("asc");
      toast("Reset complete", "Demo data restored.");
    }

    const counts = useMemo(() => {
      const total = employees.length;
      const active = employees.filter((e) => e.status === "Active").length;
      const onboarding = employees.filter((e) => e.status === "Onboarding").length;
      const inactive = employees.filter((e) => e.status === "Inactive").length;
      return { total, active, onboarding, inactive };
    }, [employees]);

    const pageTitle =
      page === "directory"
        ? "Employee Directory"
        : page === "insights"
        ? "Insights"
        : "Settings";

    const pageSubtitle =
      page === "directory"
        ? "Search, filter, and manage employee records (stored locally in your browser)."
        : page === "insights"
        ? "Quick stats based on your current records."
        : "Reset demo data and accessibility helpers.";

    return h(
      React.Fragment,
      null,
      h(
        "div",
        { className: "app" },
        h(
          "aside",
          { className: "panel sidebar" },
          h(
            "div",
            { className: "brand" },
            h("div", { className: "logo" }),
            h(
              "div",
              null,
              h("h1", null, "React + CSS Starter"),
              h("p", null, "Employee Directory demo")
            )
          ),
          h(
            "nav",
            { className: "nav", "aria-label": "Primary" },
            h(
              "button",
              { onClick: () => setPage("directory"), "aria-current": page === "directory" ? "page" : undefined },
              h("span", null, h(Icon, { name: "people" }), " Directory"),
              h("span", { className: "badge" }, counts.total)
            ),
            h(
              "button",
              { onClick: () => setPage("insights"), "aria-current": page === "insights" ? "page" : undefined },
              h("span", null, "Insights"),
              h("span", { className: "badge" }, counts.active)
            ),
            h(
              "button",
              { onClick: () => setPage("settings"), "aria-current": page === "settings" ? "page" : undefined },
              h("span", null, "Settings"),
              h("span", { className: "badge" }, "v1")
            )
          ),
          h(
            "div",
            { className: "footer" },
            h("div", null, "Tip: Focus search with ", h("span", { className: "kbd" }, "⌘/Ctrl", " + ", "K")),
            h("div", null, "Esc closes forms. Data persists via localStorage.")
          )
        ),
        h(
          "main",
          { className: "panel main" },
          h(
            "div",
            { className: "topbar" },
            h(
              "div",
              { className: "title" },
              h("h2", null, pageTitle),
              h("p", null, pageSubtitle)
            ),
            h(
              "div",
              { className: "actions" },
              page === "directory"
                ? h(
                    React.Fragment,
                    null,
                    h(
                      "div",
                      { className: "field", style: { minWidth: 260 } },
                      h("label", { htmlFor: "search" }, "Search"),
                      h("input", {
                        id: "search",
                        ref: searchRef,
                        className: "input",
                        value: query,
                        placeholder: "Name, title, dept, location, email…",
                        onChange: (e) => setQuery(e.target.value),
                        "aria-label": "Search employees",
                      })
                    ),
                    h(
                      "button",
                      { className: "btn primary", onClick: onCreate },
                      h(Icon, { name: "plus" }),
                      "Add employee"
                    )
                  )
                : null
            )
          ),
          page === "directory"
            ? h(DirectoryPage, {
                employees: filtered,
                allEmployees: employees,
                selectedId,
                onSelect: setSelectedId,
                departments,
                department,
                setDepartment,
                statuses,
                status,
                setStatus,
                sortBy,
                setSortBy,
                sortDir,
                setSortDir,
                selected,
                draft,
                onCancelDraft: () => setDraft(null),
                onSaveEmployee,
                onEdit,
                onDelete,
              })
            : page === "insights"
            ? h(InsightsPage, { employees })
            : h(SettingsPage, { onResetDemo })
        )
      ),
      h(Toasts, { toasts, onDismiss: (id) => setToasts((t) => t.filter((x) => x.id !== id)) })
    );
  }

  function DirectoryPage(props) {
    const {
      employees,
      allEmployees,
      selectedId,
      onSelect,
      departments,
      department,
      setDepartment,
      statuses,
      status,
      setStatus,
      sortBy,
      setSortBy,
      sortDir,
      setSortDir,
      selected,
      draft,
      onCancelDraft,
      onSaveEmployee,
      onEdit,
      onDelete,
    } = props;

    const listLabel = `${employees.length} of ${allEmployees.length}`;

    return h(
      "div",
      { className: "grid" },
      h(
        "section",
        { className: "card" },
        h(
          "div",
          { className: "cardHeader" },
          h("h3", null, "Employees"),
          h("span", null, listLabel)
        ),
        h(
          "div",
          { className: "cardBody" },
          h(
            "div",
            { className: "twoCol" },
            h(
              "div",
              { className: "field" },
              h("label", { htmlFor: "department" }, "Department"),
              h(
                "select",
                {
                  id: "department",
                  className: "select",
                  value: department,
                  onChange: (e) => setDepartment(e.target.value),
                },
                departments.map((d) => h("option", { key: d, value: d }, d))
              )
            ),
            h(
              "div",
              { className: "field" },
              h("label", { htmlFor: "status" }, "Status"),
              h(
                "select",
                {
                  id: "status",
                  className: "select",
                  value: status,
                  onChange: (e) => setStatus(e.target.value),
                },
                statuses.map((s) => h("option", { key: s, value: s }, s))
              )
            )
          ),
          h(
            "div",
            { className: "twoCol", style: { marginTop: 12 } },
            h(
              "div",
              { className: "field" },
              h("label", { htmlFor: "sortBy" }, "Sort by"),
              h(
                "select",
                { id: "sortBy", className: "select", value: sortBy, onChange: (e) => setSortBy(e.target.value) },
                [
                  { value: "name", label: "Name" },
                  { value: "department", label: "Department" },
                  { value: "location", label: "Location" },
                  { value: "status", label: "Status" },
                  { value: "title", label: "Title" },
                ].map((o) => h("option", { key: o.value, value: o.value }, o.label))
              )
            ),
            h(
              "div",
              { className: "field" },
              h("label", { htmlFor: "sortDir" }, "Direction"),
              h(
                "select",
                { id: "sortDir", className: "select", value: sortDir, onChange: (e) => setSortDir(e.target.value) },
                [
                  { value: "asc", label: "A → Z" },
                  { value: "desc", label: "Z → A" },
                ].map((o) => h("option", { key: o.value, value: o.value }, o.label))
              )
            )
          ),
          h(
            "div",
            { className: "list", style: { marginTop: 12 } },
            employees.length
              ? employees.map((e) =>
                  h(
                    "div",
                    {
                      key: e.id,
                      className: "row",
                      role: "button",
                      tabIndex: 0,
                      "aria-selected": selectedId === e.id ? "true" : "false",
                      onClick: () => onSelect(e.id),
                      onKeyDown: (ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          onSelect(e.id);
                        }
                      },
                    },
                    h(
                      "div",
                      { className: "meta" },
                      h("div", { className: "name" }, e.name || "(Unnamed)"),
                      h("div", { className: "sub" }, `${e.title || "—"} · ${e.department || "—"} · ${e.location || "—"}`)
                    ),
                    h(StatusPill, { status: e.status })
                  )
                )
              : h(
                  "div",
                  { className: "empty" },
                  h("strong", null, "No results."),
                  " Try clearing filters or changing the search."
                )
          )
        )
      ),
      h(
        "section",
        { className: "card" },
        h(
          "div",
          { className: "cardHeader" },
          h("h3", null, draft ? (draft.mode === "create" ? "Add employee" : "Edit employee") : "Details"),
          h("span", null, selected ? selected.department : "—")
        ),
        h(
          "div",
          { className: "cardBody" },
          draft
            ? h(EmployeeForm, {
                mode: draft.mode,
                employee: draft.mode === "edit" ? selected : null,
                onCancel: onCancelDraft,
                onSave: onSaveEmployee,
              })
            : selected
            ? h(EmployeeDetails, { employee: selected, onEdit: () => onEdit(selected.id), onDelete: () => onDelete(selected.id) })
            : h(
                "div",
                { className: "empty" },
                h("strong", null, "No employee selected."),
                " Pick someone from the list, or add a new employee."
              )
        )
      )
    );
  }

  function StatusPill({ status }) {
    const cls = status === "Active" ? "pill good" : status === "Onboarding" ? "pill warn" : "pill";
    return h("span", { className: cls }, status || "—");
  }

  function EmployeeDetails({ employee, onEdit, onDelete }) {
    return h(
      "div",
      { className: "details" },
      h(
        "div",
        { style: { display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" } },
        h(
          "div",
          null,
          h("div", { style: { fontSize: 16, fontWeight: 700, letterSpacing: 0.2 } }, employee.name),
          h("div", { style: { color: "var(--muted)", marginTop: 2, fontSize: 12 } }, employee.title || "—")
        ),
        h(
          "div",
          { style: { display: "flex", gap: 8, alignItems: "center" } },
          h("button", { className: "btn small", onClick: onEdit }, h(Icon, { name: "edit" }), "Edit"),
          h("button", { className: "btn small danger", onClick: onDelete }, h(Icon, { name: "trash" }), "Delete")
        )
      ),
      h("hr", { style: { border: 0, borderTop: "1px solid var(--border)", opacity: 0.9 } }),
      h(
        "dl",
        { className: "kv" },
        h("dt", null, "Email"),
        h("dd", null, h("a", { href: `mailto:${employee.email}` }, employee.email || "—")),
        h("dt", null, "Department"),
        h("dd", null, employee.department || "—"),
        h("dt", null, "Location"),
        h("dd", null, employee.location || "—"),
        h("dt", null, "Status"),
        h("dd", null, h(StatusPill, { status: employee.status })),
        h("dt", null, "Start date"),
        h("dd", null, employee.startDate ? formatDate(employee.startDate) : "—")
      ),
      employee.notes
        ? h("div", { className: "note" }, employee.notes)
        : h("div", { className: "note" }, "No notes yet. Use Edit to add a short bio or onboarding notes.")
    );
  }

  function EmployeeForm({ mode, employee, onCancel, onSave }) {
    const isEdit = mode === "edit";
    const [form, setForm] = useState(() => {
      const base = employee || {
        id: uid(),
        name: "",
        title: "",
        department: "Engineering",
        location: "",
        email: "",
        status: "Active",
        startDate: new Date().toISOString(),
        notes: "",
      };
      return { ...base };
    });

    useEffect(() => {
      if (isEdit && employee) setForm({ ...employee });
    }, [isEdit, employee]);

    const errors = useMemo(() => {
      const e = {};
      if (!form.name.trim()) e.name = "Name is required.";
      if (!form.email.trim()) e.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email.";
      if (!form.department.trim()) e.department = "Department is required.";
      if (!form.status.trim()) e.status = "Status is required.";
      return e;
    }, [form]);

    const canSave = Object.keys(errors).length === 0;

    function setField(k, v) {
      setForm((f) => ({ ...f, [k]: v }));
    }

    function onSubmit(e) {
      e.preventDefault();
      if (!canSave) return;
      const next = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        title: form.title.trim(),
        department: form.department.trim(),
        location: form.location.trim(),
        notes: form.notes.trim(),
      };
      onSave(next);
    }

    return h(
      "form",
      { onSubmit, className: "details" },
      h(
        "div",
        { className: "twoCol" },
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "name" }, "Full name"),
          h("input", {
            id: "name",
            className: "input",
            value: form.name,
            placeholder: "e.g. Priya Sharma",
            onChange: (e) => setField("name", e.target.value),
            "aria-invalid": errors.name ? "true" : "false",
          }),
          errors.name ? h("div", { style: { color: "var(--bad)", fontSize: 12 } }, errors.name) : null
        ),
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "email" }, "Email"),
          h("input", {
            id: "email",
            className: "input",
            value: form.email,
            placeholder: "name@company.com",
            onChange: (e) => setField("email", e.target.value),
            "aria-invalid": errors.email ? "true" : "false",
          }),
          errors.email ? h("div", { style: { color: "var(--bad)", fontSize: 12 } }, errors.email) : null
        )
      ),
      h(
        "div",
        { className: "twoCol" },
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "title" }, "Title"),
          h("input", {
            id: "title",
            className: "input",
            value: form.title,
            placeholder: "e.g. Software Engineer",
            onChange: (e) => setField("title", e.target.value),
          })
        ),
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "department" }, "Department"),
          h("input", {
            id: "department",
            className: "input",
            value: form.department,
            placeholder: "e.g. Engineering",
            onChange: (e) => setField("department", e.target.value),
            "aria-invalid": errors.department ? "true" : "false",
          }),
          errors.department ? h("div", { style: { color: "var(--bad)", fontSize: 12 } }, errors.department) : null
        )
      ),
      h(
        "div",
        { className: "twoCol" },
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "location" }, "Location"),
          h("input", {
            id: "location",
            className: "input",
            value: form.location,
            placeholder: "e.g. Hyderabad / Remote",
            onChange: (e) => setField("location", e.target.value),
          })
        ),
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "status" }, "Status"),
          h(
            "select",
            {
              id: "status",
              className: "select",
              value: form.status,
              onChange: (e) => setField("status", e.target.value),
              "aria-invalid": errors.status ? "true" : "false",
            },
            ["Active", "Onboarding", "Inactive"].map((s) => h("option", { key: s, value: s }, s))
          ),
          errors.status ? h("div", { style: { color: "var(--bad)", fontSize: 12 } }, errors.status) : null
        )
      ),
      h(
        "div",
        { className: "field" },
        h("label", { htmlFor: "startDate" }, "Start date"),
        h("input", {
          id: "startDate",
          className: "input",
          type: "date",
          value: (form.startDate || "").slice(0, 10),
          onChange: (e) => {
            const iso = new Date(e.target.value + "T00:00:00.000Z").toISOString();
            setField("startDate", iso);
          },
        })
      ),
      h(
        "div",
        { className: "field" },
        h("label", { htmlFor: "notes" }, "Notes"),
        h("textarea", {
          id: "notes",
          className: "textarea",
          value: form.notes,
          placeholder: "A short note about responsibilities, onboarding, or highlights…",
          onChange: (e) => setField("notes", e.target.value),
        })
      ),
      h(
        "div",
        { style: { display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" } },
        h("button", { type: "button", className: "btn", onClick: onCancel }, "Cancel"),
        h(
          "button",
          { type: "submit", className: "btn primary", disabled: !canSave },
          h(Icon, { name: "check" }),
          isEdit ? "Save changes" : "Add employee"
        )
      )
    );
  }

  function InsightsPage({ employees }) {
    const byDept = useMemo(() => {
      const m = new Map();
      for (const e of employees) m.set(e.department || "Unassigned", (m.get(e.department || "Unassigned") || 0) + 1);
      return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
    }, [employees]);

    const byStatus = useMemo(() => {
      const m = new Map();
      for (const e of employees) m.set(e.status || "Unknown", (m.get(e.status || "Unknown") || 0) + 1);
      return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
    }, [employees]);

    const newest = useMemo(() => {
      const copy = employees.slice();
      copy.sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
      return copy.slice(0, 3);
    }, [employees]);

    return h(
      "div",
      { className: "grid" },
      h(
        "section",
        { className: "card" },
        h("div", { className: "cardHeader" }, h("h3", null, "By department"), h("span", null, `${byDept.length} groups`)),
        h(
          "div",
          { className: "cardBody" },
          byDept.length
            ? h(
                "div",
                { className: "list" },
                byDept.map(([dept, count]) =>
                  h(
                    "div",
                    { key: dept, className: "row", role: "group", tabIndex: -1, style: { cursor: "default" } },
                    h("div", { className: "meta" }, h("div", { className: "name" }, dept), h("div", { className: "sub" }, "Team size")),
                    h("span", { className: "pill" }, String(count))
                  )
                )
              )
            : h("div", { className: "empty" }, "No data yet.")
        )
      ),
      h(
        "section",
        { className: "card" },
        h("div", { className: "cardHeader" }, h("h3", null, "By status"), h("span", null, `${employees.length} total`)),
        h(
          "div",
          { className: "cardBody" },
          byStatus.length
            ? h(
                "div",
                { className: "details" },
                h(
                  "div",
                  { className: "list" },
                  byStatus.map(([s, count]) =>
                    h(
                      "div",
                      { key: s, className: "row", role: "group", tabIndex: -1, style: { cursor: "default" } },
                      h("div", { className: "meta" }, h("div", { className: "name" }, s), h("div", { className: "sub" }, "Employees")),
                      h(StatusPill, { status: s })
                    )
                  )
                ),
                h(
                  "div",
                  { className: "empty" },
                  h("strong", null, "Newest hires"),
                  h(
                    "div",
                    { style: { marginTop: 10, display: "grid", gap: 8 } },
                    newest.map((e) =>
                      h(
                        "div",
                        { key: e.id, style: { display: "flex", justifyContent: "space-between", gap: 12 } },
                        h("div", null, h("div", { style: { fontWeight: 650 } }, e.name), h("div", { style: { fontSize: 12, color: "var(--muted)" } }, e.title || "—")),
                        h("div", { style: { fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" } }, e.startDate ? formatDate(e.startDate) : "—")
                      )
                    )
                  )
                )
              )
            : h("div", { className: "empty" }, "No data yet.")
        )
      )
    );
  }

  function SettingsPage({ onResetDemo }) {
    return h(
      "div",
      { className: "grid" },
      h(
        "section",
        { className: "card" },
        h("div", { className: "cardHeader" }, h("h3", null, "Demo controls"), h("span", null, "Local only")),
        h(
          "div",
          { className: "cardBody" },
          h(
            "div",
            { className: "details" },
            h(
              "div",
              { className: "empty" },
              h("strong", null, "This project avoids build tools."),
              " It runs as a static site using React via CDN. Your changes save into your browser's localStorage."
            ),
            h(
              "div",
              { style: { display: "flex", justifyContent: "flex-end" } },
              h("button", { className: "btn danger", onClick: onResetDemo }, h(Icon, { name: "reset" }), "Reset demo data")
            )
          )
        )
      ),
      h(
        "section",
        { className: "card" },
        h("div", { className: "cardHeader" }, h("h3", null, "Accessibility"), h("span", null, "Keyboard friendly")),
        h(
          "div",
          { className: "cardBody" },
          h(
            "div",
            { className: "details" },
            h("div", { className: "note" }, "Keyboard shortcuts:"),
            h(
              "ul",
              { className: "note", style: { marginTop: 0 } },
              h("li", null, h("span", { className: "kbd" }, "⌘/Ctrl + K"), " focus search"),
              h("li", null, h("span", { className: "kbd" }, "Enter/Space"), " select employee from list"),
              h("li", null, h("span", { className: "kbd" }, "Esc"), " closes add/edit form")
            )
          )
        )
      )
    );
  }

  const rootEl = document.getElementById("root");
  ReactDOM.createRoot(rootEl).render(h(App));
})();
