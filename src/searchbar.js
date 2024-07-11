import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { Divider, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useState } from 'react';

import Data from './data';

export default function FreeSolo() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div style={{display:'flex', flexDirection: 'column', alignItems:'center'}}>
      <div>
      <Autocomplete
        sx={{width: 1400}}
        freeSolo
        id="free-solo-2-demo"
        disableClearable
        options={[]}

        onChange={(e) => setSearchQuery(e.target.value)}
        value={searchQuery}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Type your medicine name here"
            InputProps={{
              ...params.InputProps,
              type: 'search',
              endAdornment: (
                <IconButton type='submit'>
                    <SearchIcon />
                </IconButton>
              )
            }}
          />
        )}
      />
    </div>
    <Divider />

    {searchQuery && <Data searchQuery={searchQuery}/>}
    </div>
  );
}
