"use strict";
const startYear = document.getElementById("startYear");
const degree = document.getElementById("degree");
const maths = document.getElementById("maths");
const chem = document.getElementById("chem");

var modules = [];

function yearFile(year, plus = 0) {
  const y = parseInt(year) + plus;
  return "data/" + y + "-" + (y - 2000 + 1) + ".json";
}

function updateChoices() {
  for (const level of [1, 2, 3]) {
    let credits = 0;
    let michCredits = 0;
    let epipCredits = 0;
    for (const code in modules) {
      if (modules.hasOwnProperty(code)) {
        const mod = modules[code];
        if (mod.level == level && mod.selected) {
          const modCreds = mod.credits;
          credits += mod.credits;
          if (mod.mich && mod.epip) {
            michCredits += mod.credits / 2;
            epipCredits += mod.credits / 2;
          } else if (mod.mich) {
            michCredits += mod.credits;
          } else if (mod.epip) {
            epipCredits += mod.credits;
          } else {
            console.error("Module seems not to run in either term: ", i);
          }
        }
      }
    }
    const note = document.getElementById("note" + level);
    $(note).empty();
    const credNote = document.createElement("p");
    const credTot = document.createElement("span");
    credTot.innerHTML = credits + "/120";
    if (credits != 120) {
      credTot.classList.add("invalid");
    }
    const michTot = document.createElement("span");
    const epipTot = document.createElement("span");
    michTot.innerHTML = michCredits;
    epipTot.innerHTML = epipCredits;
    if (michCredits > 70 || michCredits < 50) {
      michTot.classList.add("invalid");
    }
    if (epipCredits > 70 || epipCredits < 50) {
      epipTot.classList.add("invalid");
    }

    $(credNote).append(credTot, "&nbsp;credits (", michTot,
                       " Michaelmas; ", epipTot, " Epiphany)");
    note.appendChild(credNote);
  }
}

function setTerm(box, term) {
  box.classList.remove(term == "mich" ? "epip" : "mich");
  box.classList.add(term);
}

function choose(box, chosen = true) {
  const code = $(box).attr("id");
  modules[code].selected = chosen;
  document.getElementById("check" + code).checked = chosen;
  updateChoices();
}

function makeAvailable(box, avail = true) {
  if (avail) {
    box.classList.remove("unavailable");
  } else {
    box.classList.add("unavailable");
    choose(box, false);
  }
}

function makeRequired(box, req = true) {
  if (req) {
    makeAvailable(box);
    box.classList.add("required");
    box.getElementsByTagName("input").disabled = true;
    choose(box);
  } else {
    box.classList.remove("required");
    box.getElementsByTagName("input").disabled = false;
  }
}

async function updateParams() {
  for (const level of [1, 2, 3, 4]) {
    await fetch(yearFile(startYear.value, level - 1))
      .then(response => response.json())
      .then(data => {
        data.forEach(module => {
          if (module.Level == level) {
            let required = (module[degree.value] === undefined ?
              false : module[degree.value].toUpperCase());
            // Maths / further maths
            if (module["Module code"] == "GEOL1061" && required) {
              required = maths.checked ? "O" : "X";
            } else if (module["Module code"] == "GEOL1081" && required) {
              required = maths.checked ? "X" : "O";
            }

            const moduleExists = modules.hasOwnProperty(module["Module code"]);
            const box = moduleExists ? modules[module["Module code"]].box :
                        document.createElement("div");

            if (!moduleExists) {
              box.classList.add("module-box");
              box.setAttribute("id", module["Module code"]);
              if (module.Credits == 40) {
                box.classList.add("double");
              } else if (module.Credits == 60) {
                box.classList.add("triple");
              }

              const check = document.createElement("input");
              check.type = "checkbox";
              check.id = "check" + module["Module code"];

              box.appendChild(check);
              box.addEventListener("click", function(e) {
                if (e.srcElement != check && !check.disabled) {
                  check.checked = !check.checked;
                }
                choose(box, check.checked);
                updateChoices();
              })

              const text = document.createElement("div");
              const code = document.createElement("span");
              code.innerHTML = module["Module code"];
              code.classList.add("module-code");
              const name = document.createElement("span");
              name.innerHTML = module["Module name"];
              name.classList.add("module-name");
              text.classList.add("module-text");
              text.appendChild(name);
              text.appendChild(code);
              box.appendChild(text);

              document.getElementById("level" + module.Level).appendChild(box);
            }


            modules[module["Module code"]] = {
              available: required != "O",
              required: required,
              credits: module.Credits,
              level: module.Level,
              mich: module.Mich,
              epip: module.Epip,
              req: module.Requisites,
              box: box
            }

            if (module.Credits == 10) {
              if (module.Epip) {
                setTerm(box, "epip")
              } else if (module.Mich) {
                setTerm(box, "mich")
              }
            }
            if (required == "X") {
              makeRequired(box)
            } else if (required == "O") {
              makeAvailable(box, false);
            }
          }
        })
      });
  };
  updateChoices();
}

fetch("data/years.json")
  .then(response => response.json())
  .then(data => {
    data.slice(0, -2).forEach(year => {
      const option = document.createElement("option");
      option.textContent = year.replace("-", "/");
      option.value = year.substring(0, 4);
      startYear.appendChild(option);
    })
    updateParams();
  })
  .catch(error => console.error("Error fetching years.json: ", error))

startYear.addEventListener("change", updateParams)
degree.addEventListener("change", updateParams)
maths.addEventListener("change", updateParams)
chem.addEventListener("change", updateParams)
