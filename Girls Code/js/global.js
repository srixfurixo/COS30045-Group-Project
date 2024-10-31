/*
----------------------------------------------------
    Global variables
----------------------------------------------------
*/   
// Define a mapping for category order
const categoryOrder = {
    "0-5": 0,
    "5-15": 1,
    "15-25": 2,
    "25-35": 3,
    "35-45": 4,
    "45-55": 5,
    "55-65": 6
};

let countriesAvailable_story5_mort;
let countriesAvailable_story5_life;

const COLORS = {
    darkPink: "#ca0c6e",
    lightPink: "pink",
    darkGreen: "#059a4e",
    lightGreen: "lightgreen",
    webTheme: {
        midGrey: "#585858",
        darkGrey: "#2a2a2a",
        pink: "#fa65b1",
    },
    categoryRange: ["#726ae3","#58508d","#bc5090","#fa65b1", "#f58b56","#ffa600", "#39b83f"]
}

// Prefix data, to be updated later
var highMortalityCountries = ["Latvia", "Lithuania","Hungary"]
var lowMortalityCountries = ["Costa Rica" , "Turkey","Israel"]
var selectedMinYear = 2000;
var selectedMaxYear = 2019;

// var colors = ["#FFF4DF", "#FFD380", "#FFA600", "#FFC0CB", "#E5669D", "#CA0C6E"];
