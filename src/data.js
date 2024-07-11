import { Card, CardContent, Grid, Button, Box } from "@mui/material";
import { useEffect, useReducer, useCallback } from "react";

const initialState = {
    searchResults: [],
    selectedForm: {},
    selectedStrength: {},
    selectedPackaging: {},
    lowestPrice: {}
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_SEARCH_RESULTS':
            return {
                ...state,
                searchResults: action.payload
            };
        case 'SET_SELECTION':
            return {
                ...state,
                selectedForm: {
                    ...state.selectedForm,
                    [action.salt]: action.form
                },
                selectedStrength: {
                    ...state.selectedStrength,
                    [action.salt]: action.strength
                },
                selectedPackaging: {
                    ...state.selectedPackaging,
                    [action.salt]: action.packaging
                },
                lowestPrice: {
                    ...state.lowestPrice,
                    [action.salt]: action.price
                }
            };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

export default function Data({searchQuery}) {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        const fetchData = async() => {
            try {
                const response = await fetch(`https://backend.cappsule.co.in/api/v1/new_search?q=${searchQuery}&pharmacyIds=1,2,3`)

                if(!response.ok) {
                    throw new Error("Response is not OK")
                }

                const data = await response.json()
                const searchResults = data.data.saltSuggestions
                dispatch({type: 'SET_SEARCH_RESULTS', payload: searchResults})

                // Set defaults for each salt
                searchResults.forEach((result) => {
                    if (result.available_forms.length > 0) {
                        const defaultForm = result.available_forms[0];
                        const saltFormsJson = result.salt_forms_json[defaultForm];

                        if (saltFormsJson) {
                            const strengths = Object.keys(saltFormsJson);
                            if (strengths.length > 0) {
                                const defaultStrength = strengths[0];
                                const packaging = saltFormsJson[defaultStrength];

                                if (packaging) {
                                    const packagingKeys = Object.keys(packaging);
                                    if (packagingKeys.length > 0) {
                                        const defaultPackaging = packagingKeys[0];

                                        const lowestPrice = getLowestPrice(result, defaultForm, defaultStrength, defaultPackaging);

                                        dispatch({
                                            type: 'SET_SELECTION',
                                            salt: result.salt,
                                            form: defaultForm,
                                            strength: defaultStrength,
                                            packaging: defaultPackaging,
                                            price: lowestPrice
                                        });
                                    }
                                }
                            }
                        }
                    }
                });
            }
            catch(error) {
                console.log(error)
            }
        }

        if(searchQuery) {
            fetchData()
        }
    }, [searchQuery])

    const getLowestPrice = (result, form, strength, packaging) => {
        const packagingDetails = result.salt_forms_json[form][strength][packaging];
        let current = null;

        if (Array.isArray(packagingDetails)) {
            packagingDetails.forEach((item) => {
                if (item && item.selling_price !== null) {
                    const currentPrice = item.selling_price;
                    if (current === null || current > currentPrice) {
                        current = currentPrice;
                    }
                }
            });
        }

        return current;
    };

    const handleFormSelection = useCallback((salt, form) => {
        const result = state.searchResults.find((result) => result.salt === salt);
        if (result && result.salt_forms_json[form]) {
            const strengths = Object.keys(result.salt_forms_json[form]);
            if (strengths.length > 0) {
                const defaultStrength = strengths[0];
                const packaging = result.salt_forms_json[form][defaultStrength];

                if (packaging) {
                    const packagingKeys = Object.keys(packaging);
                    if (packagingKeys.length > 0) {
                        const defaultPackaging = packagingKeys[0];
                        const lowestPrice = getLowestPrice(result, form, defaultStrength, defaultPackaging);

                        dispatch({
                            type: 'SET_SELECTION',
                            salt,
                            form,
                            strength: defaultStrength,
                            packaging: defaultPackaging,
                            price: lowestPrice
                        });
                    }
                }
            }
        }
    }, [state.searchResults]);

    const handleStrengthSelection = useCallback((salt, form, strength) => {
        const result = state.searchResults.find((result) => result.salt === salt);
        if (result && result.salt_forms_json[form] && result.salt_forms_json[form][strength]) {
            const packaging = result.salt_forms_json[form][strength];

            if (packaging) {
                const packagingKeys = Object.keys(packaging);
                if (packagingKeys.length > 0) {
                    const defaultPackaging = packagingKeys[0];
                    const lowestPrice = getLowestPrice(result, form, strength, defaultPackaging);

                    dispatch({
                        type: 'SET_SELECTION',
                        salt,
                        form,
                        strength,
                        packaging: defaultPackaging,
                        price: lowestPrice
                    });
                }
            }
        }
    }, [state.searchResults]);

    const handlePackagingSelection = useCallback((salt, form, strength, packaging) => {
        const result = state.searchResults.find((result) => result.salt === salt);
        if (result && result.salt_forms_json[form] && result.salt_forms_json[form][strength] && result.salt_forms_json[form][strength][packaging]) {
            const lowestPrice = getLowestPrice(result, form, strength, packaging);

            dispatch({
                type: 'SET_SELECTION',
                salt,
                form,
                strength,
                packaging,
                price: lowestPrice
            });
        }
    }, [state.searchResults]);

    const renderForms = useCallback((result) => {
        return result.available_forms.map((form, index) => (
            <Button
                key={index}
                style={{
                    left: '70px',
                    color: 'black',
                    borderColor: 'black',
                    boxShadow: '0 0 0 3px #bcebe4',
                    width: '30px',
                    height: '30px',
                    borderRadius: '10px',
                    fontSize: '10px'
                }}
                variant="outlined"
                onClick={() => handleFormSelection(result.salt, form)}
            >
                {form}
            </Button>
        ));
    }, [handleFormSelection]);

    const renderStrengths = useCallback((result, selectedForm) => {
        return Object.keys(result.salt_forms_json[selectedForm]).map((strength, index) => (
            <Button
                key={index}
                style={{
                    left: '40px',
                    color: 'black',
                    borderColor: 'black',
                    boxShadow: '0 0 0 3px #bcebe4',
                    width: 'auto',
                    height: 'auto',
                    borderRadius: '10px',
                    fontSize: '10px'
                }}
                variant="outlined"
                onClick={() => handleStrengthSelection(result.salt, selectedForm, strength)}
            >
                {strength}
            </Button>
        ));
    }, [handleStrengthSelection]);

    const renderPackaging = useCallback((result, selectedForm, selectedStrength) => {
        return Object.keys(result.salt_forms_json[selectedForm][selectedStrength]).map((packaging, index) => (
            <Button
                key={index}
                style={{
                    left: '40px',
                    color: 'black',
                    borderColor: 'black',
                    boxShadow: '0 0 0 3px #bcebe4',
                    width: 'auto',
                    height: 'auto',
                    borderRadius: '10px',
                    fontSize: '10px'
                }}
                variant="outlined"
                onClick={() => handlePackagingSelection(result.salt, selectedForm, selectedStrength, packaging)}
            >
                {packaging}
            </Button>
        ));
    }, [handlePackagingSelection]);

    return(
        <div>
            {state.searchResults.map((result) => {
                const selectedForm = state.selectedForm[result.salt];
                const selectedStrength = state.selectedStrength[result.salt];
                const selectedPackaging = state.selectedPackaging[result.salt];

                return (
                    <Card spacing={5} key={result.id} style={{ minWidth: '1400px', borderRadius: '10px', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)', background: 'linear-gradient(to right, #ffffff, #e1f5f3)' }}>
                        <CardContent>
                            <Grid container border="1px solid black" spacing={3} direction="column" gridTemplateColumns="1fr 1fr 1fr" display="grid">

                                <Grid item xs={4}>
                                    <strong><span>Form:</span></strong>
                                    {renderForms(result)}
                                </Grid>

                                <Grid item></Grid>
                                <Grid item></Grid>

                                {selectedForm && (
                                    <Grid item xs={4}>
                                        <strong><span>Strength:</span></strong>
                                        {renderStrengths(result, selectedForm)}
                                    </Grid>
                                )}

                                <Grid item></Grid>
                                <Grid item></Grid>

                                {selectedForm && selectedStrength && (
                                    <Grid item xs={4}>
                                        <strong><span>Packaging:</span></strong>
                                        {renderPackaging(result, selectedForm, selectedStrength)}
                                    </Grid>
                                )}

                                <Grid item></Grid>
                                <Grid item></Grid>

                                <Grid item>
                                    <strong>{result.salt}</strong>
                                </Grid>

                                <Grid item>
                                    {state.lowestPrice[result.salt] !== null ? (
                                        <strong>
                                            <div style={{ fontSize: '30px', alignItems: 'flex-end' }}>
                                                From ${state.lowestPrice[result.salt]}
                                            </div>
                                        </strong>
                                    ) : (
                                        <Box sx={{
                                            p: 2,
                                            border: "0.5px solid #bce8d6",
                                            borderWidth: 'thin',
                                            borderRadius: '10px',
                                            background: 'white'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                No stores selling this product near you
                                            </div>
                                        </Box>
                                    )}
                                </Grid>

                            </Grid>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
);
}